_ = require 'underscore-plus'
psTree = require 'ps-tree'
shell = require 'shelljs'
{Directory, File} = require 'atom'
{$$} = require 'atom-space-pen-views'
ProcessConfig = require '../process-config'
ProcessOutputView = require '../views/process-output-view'
InputDialogView = require '../views/input-dialog-view'
ProjectsView = require '../views/projects-view'
Buffer = require './buffer'
cp = require('child_process')

# Fields :
# stdout : Standard output.
# stderr : Standard error output.
# exitStatus : Code returned by command.
# clipboard : Text currently on clipboard.
# fullCommand : The full command along with its arguments.
# configDirAbsPath : Absolute path of folder that the configuration file is in.
# projectPath : Absolute path of project folder.
#
# Only if a file is currently open :
# fileExt : Extension of file.
# fileName : Name of file without extension.
# fileNameExt : Name of file with extension.
# filePath : Path of file relative to project.
# fileDirPath : Path of file's directory relative to project.
# fileAbsPath : Absolute path of file.
# fileDirAbsPath : Absolute path of file's directory.
# selection : Currently selected text.
# fileProjectPath : Absolute path of project folder.

module.exports =
class ProcessController

  @config : null;
  @disposable : null;
  @process : null;
  @processCallbacks : null;

  constructor: (@configController, @config) ->
    @processCallbacks = [];
    @replaceRegExp = new RegExp("{.*?}","g");
    @fields = {};
    @options = {};
    @newFile = null;
    @creatingNewFile = false;
    @newFileDisposable = null;
    @endTime = null;
    @outputView = null;
    @stdoutBuffer = new Buffer(@config.outputBufferSize);
    @stderrBuffer = new Buffer(@config.outputBufferSize);
    @killed = false;
    @exitStatus = null;

    if (@config.outputTarget == "panel")
      @outputView = new ProcessOutputView(@configController.getMain(), @);

  getProcessID: ->
    return @processID;

  isKilled: ->
    return @killed;

  getExitStatus: ->
    return @exitStatus;

  dispose: ->
    # TODO : The key binding should preferably be removed, but atom.keymaps.findKeyBindings throws an error.
    @newFileDisposable?.dispose();
    @outputView?.destroy();

  # Return false if the process didn't start.
  runProcessWithFile: (filePath) ->
    if @process?
      return false;

    @fields = {};
    @options = {};

    @fields.clipboard = atom.clipboard.read();
    @fields.configDirAbsPath = @configController.projectController.projectPath;
    @fields.stdout = "";
    @fields.stderr = "";
    @fields.selectProjectPath = "";

    projectPaths = atom.project.getPaths();

    if projectPaths.length > 0
      @fields.projectPath = projectPaths[0];
    else
      @fields.projectPath = @configController.projectController.projectPath;

    editor = atom.workspace.getActiveTextEditor();

    if editor
      @fields.selection = editor.getSelectedText();
      @fields.word = editor.getWordUnderCursor();
      lastCursor = editor.getLastCursor();
      if lastCursor?
        @fields.line = lastCursor.getCurrentBufferLine();
      else
        @fields.line = '';

    if filePath
      file = new File(filePath);

      nameExt = @splitFileName(file.getBaseName());
      @fields.fileName = nameExt[0];
      @fields.fileExt = nameExt[1];

      @fields.fileNameExt = file.getBaseName();
      @fields.fileAbsPath = file.getRealPathSync();
      @fields.fileDirAbsPath = file.getParent().getRealPathSync();

      relPaths = atom.project.relativizePath(@fields.fileAbsPath);
      @fields.fileProjectPath = relPaths[0];
      @fields.filePath = relPaths[1];

      relPaths = atom.project.relativizePath(@fields.fileDirAbsPath);
      @fields.fileDirPath = relPaths[1];
    else
      @fields.fileName = "";
      @fields.fileExt = "";
      @fields.fileNameExt = "";
      @fields.fileAbsPath = "";
      @fields.fileDirAbsPath = "";
      @fields.filePath = "";
      @fields.fileDirPath = "";
      @fields.fileProjectPath = "";
      @fields.selection = "";

    if !@saveDirtyFiles()
      return false;

    @takeUserInput(@config.inputDialogs);

# Return true if the execution should continue. false if the user canceled.
  saveDirtyFiles: ->
    if @config.saveOption == 'none'
      return true;
    else if @config.saveOption == 'all'
      return @saveEditors(@getAllDirtyEditors());
    else if @config.saveOption == 'referenced'
      return @saveEditors(@getReferencedDirtyEditors());

    return true;

  getAllDirtyEditors: ->
    result = [];

    for editor in atom.workspace.getTextEditors()
      if @isEditorDirty(editor)
        result.push(editor);

    return result;

  getReferencedDirtyEditors: ->
    result = []

    if @fields.fileAbsPath.length == 0
      return result;

    if !@commandDependsOnFile()
      return result;

    editor = @getEditorWithPath(@fields.fileAbsPath);

    if @isEditorDirty(editor)
      result.push(editor);

    return result;

  # Return true of the command to run references either {filePath} or {fileAbsPath}
  commandDependsOnFile: ->
    return @config.command.includes('{filePath}') or @config.command.includes('{fileAbsPath}');

  isEditorDirty: (editor) ->
    if !editor?
      return false;

    return editor.isModified() and editor.getTitle() != 'untitled';

  getEditorWithPath: (path) ->
    relPath = atom.project.relativizePath(path)[1];

    for editor in atom.workspace.getTextEditors()
      if relPath == atom.project.relativizePath(editor.getPath())[1]
        return editor;

    return null;

  saveEditors: (editors) ->
    if editors.length == 0
      return true;

    option = 'yes';

    if @config.promptToSave
      option = @promptToSave(editors);

      if option == 'cancel'
        return false;

    if option == 'yes'
      for editor in editors
        editor.save();

    return true;

  # Prompt to ask if editors should be saved. Return 'yes', 'no' or 'cancel'
  promptToSave: (editors) ->
    parts = ['The following files have been modified :\n'];
    for editor in editors
      parts.push(' - '+editor.getTitle());
    parts.push('\nSave changes before running?')

    options = {};
    options.message = 'Save Changes';
    options.detailedMessage = parts.join('\n');
    options.buttons = ['Yes', 'No', 'Cancel'];

    choice = atom.confirm(options);
    return options.buttons[choice].toLowerCase();

  takeUserInput: (inputDialogs) ->
    if inputDialogs.length > 0
      inputDialogParams = inputDialogs[0];
      new InputDialogView @insertFields(inputDialogParams.message ? ""),
        @insertFields(inputDialogParams.initialInput ? ""), (inputText) =>
          @fields[inputDialogParams.variableName] = inputText;
          @takeUserInput(inputDialogs[1..]);
      return;

    @runProcessAfterUserInput();

  runProcessAfterUserInput: ->
    if @config.command.indexOf("selectProjectPath") != -1
      @takeProjectInput();
    else
      @runProcessAfterProjectInput();

  takeProjectInput: ->
    callback = (value) => @projectInputCallback(value);
    new ProjectsView(callback, true);

  projectInputCallback: (value) ->
    if value?
      @fields.selectProjectPath = value;

    @runProcessAfterProjectInput();

  runProcessAfterProjectInput: ->
    if @config.cwd
      @options.cwd = @insertFields(@config.cwd);
    else
      @options.cwd = @fields.projectPath;

    command = @insertFields(@config.command);

    args = [];
    for argument in @config.arguments
      args.push(@insertFields(argument));

    @fields.fullCommand = command;

    if args.length > 0
      @fields.fullCommand += " " + args.join(" ");
      @fields.fullCommand = @fields.fullCommand.trim();

    @envBackup = {};
    @pwdBackup = shell.pwd();

    if @config.env != null
      for key, val of @config.env
        @envBackup[key] = shell.env[key];
        shell.env[key] = @insertFields(val);

    shell.cd(@options.cwd);

    @process = shell.exec @fields.fullCommand, {silent:true, async:true}, (code) =>
      @fields.exitStatus = code;
      @processStopped(!code?);

    if !@process?
      notifOptions = {};
      notifOptions["dismissable"] = true;
      notifOptions["detail"] = "Could not execute command '#{@fields.fullCommand}'";
      atom.notifications.addWarning("Error executing #{@config.namespace}: #{@config.action}", notifOptions);
      return;

    @processID = @process.pid;

    @process.stdout.on "data", (data) =>
      @stdoutBuffer.push(data);
      if @config.stream
        @streamOutput(data);

    @process.stderr.on "data", (data) =>
      @stderrBuffer.push(data);
      if @config.stream
        @streamOutput(data);

    @processStarted();

  getCwd: ->
    return @options.cwd;

  splitFileName: (fileNameExt) ->
    index = fileNameExt.lastIndexOf(".");

    if index == -1
      return [fileNameExt, ""];

    return [fileNameExt.substr(0, index), fileNameExt.substr(index+1)];

  insertFields: (text) ->
    return text.replace(@replaceRegExp, @createReplaceCallback());

  createReplaceCallback: ->
    return (text) =>
      return @pipeField(text.slice(1,-1))

  pipeField: (text) ->
    parts = text.split('|');
    fieldName = parts[0].trim();
    value = @fields[fieldName];

    if !value?
      value = '';

    if parts.length == 2
      value = @pipeValue(value, parts[1].trim());

    return value;

  pipeValue: (value, filter) ->
    if filter == 'posix' or filter == 'unix'
      return value.split('\\').join('/');
    else if filter == 'win'
      return value.split('/').join('\\');
    else if filter == 'trim'
      return value.trim();

    return value;

  addProcessCallback: (callback) ->
    @processCallbacks.push(callback);

  removeProcessCallback: (callback) ->
    index = @processCallbacks.indexOf(callback);

    if (index != -1)
      @processCallbacks.splice(index, 1);

  killProcess:  ->
    if @process == null
      return;

    try
      if process.platform == "win32"
        @killWindowsProcess();
      else
        @killLinuxProcess();
    catch err
      @process.kill();
      console.log(err);

  killWindowsProcess: ->
    parentProcess = @process;
    killProcess = cp.spawn("taskkill /PID " + @process.pid + " /T /F");

    killProcess.on "error", (err) =>
      parentProcess.kill();
      console.log(err);

    killProcess.on "close", =>
      parentProcess.kill();

  killLinuxProcess: ->
    psTree @process.pid, (err, children) =>
      parentProcess = @process;
      killProcess = cp.spawn("kill", ["-9"].concat(children.map((p) -> return p.PID)));

      killProcess.on "error", (err) =>
        parentProcess.kill();
        console.log(err);

      killProcess.on "close", =>
        parentProcess.kill();

  streamOutput: (output) ->
    @outputToTarget(output, true);

    for processCallback in @processCallbacks
      if typeof processCallback.streamOutput is "function"
        processCallback.streamOutput(output);

  processStarted: ->
    @configController.notifyProcessStarted(@);
    _.invoke(_.clone(@processCallbacks), "processStarted");

  processStopped: (killed) =>
    @process = null;
    @endTime = Date.now();
    @killed = killed;
    @exitStatus = @fields.exitStatus;
    output = "";
    messageTitle = _.humanizeEventName(@config.getCommandName());
    @fields.stdout = @stdoutBuffer.toString();
    @fields.stderr = @stderrBuffer.toString();

    @stdoutBuffer.clear();
    @stderrBuffer.clear();

    notifOptions = {};

    if !killed
      if @fields.exitStatus == 0
        if @config.successMessage?
          notifOptions["detail"] = @insertFields(@config.successMessage);
          atom.notifications.addSuccess(messageTitle, notifOptions);
      else
        if @config.errorMessage?
          notifOptions["dismissable"] = true;
          notifOptions["detail"] = @insertFields(@config.errorMessage);
          atom.notifications.addWarning(messageTitle, notifOptions);

    if !@config.stream
      if @fields.exitStatus == 0
        if @config.successOutput?
          output = @insertFields(@config.successOutput);
      else
        if @config.errorOutput?
          output = @insertFields(@config.errorOutput);

      @outputToTarget(output, false);

    for key, val of @envBackup
      if _.isUndefined(@envBackup[key])
        delete shell.env[key];
      else
        shell.env[key] = @envBackup[key];

    shell.cd(@pwdBackup);

    @fields = {};

    @configController.notifyProcessStopped(@);
    _.invoke(_.clone(@processCallbacks), "processStopped");

  outputToTarget: (output, stream) ->
    if (@config.outputTarget == "editor")
      editor = atom.workspace.getActiveTextEditor();

      if editor?
        editor.insertText(output);
    else if (@config.outputTarget == "clipboard")
      atom.clipboard.write(output);
    else if (@config.outputTarget == "console")
      console.log(output);
    else if (@config.outputTarget == "panel")
      @outputToPanel(output);
    else if (@config.outputTarget == "file")
      @outputToNewFile(output);

  openNewFile: (text) ->
    @creatingNewFile = true;

    atom.workspace.open().then (textEditor) =>
      @newFile = textEditor;
      @creatingNewFile = false;

      @newFileDisposable = @newFile.onDidDestroy =>
        @newFileDestroyed();

      @outputToNewFile(text);

      # It's possible for the text editor to open only after the process has stopped.
      if @process == null
        @cleanUpNewFileAfterProcess();

  newFileDestroyed: ->
    @newFile = null;
    @newFileDisposable?.dispose();
    @newFileDisposable = null;

    if @process == null
      @configController.removeProcessController(@);

  outputToNewFile: (text) ->
    if @creatingNewFile
      return;

    if @newFile == null
      @openNewFile(text);
    else
      @newFile.insertText(text);

  outputToPanel: (text) ->
    @outputView.outputToPanel(text);

  showNewFile: ->
    if @newFile == null
      return;

    pane = atom.workspace.paneForItem(@newFile);
    pane?.activateItem(@newFile);
