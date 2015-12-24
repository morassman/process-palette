_ = require 'underscore-plus'
psTree = require 'ps-tree'
shell = require 'shelljs'
{Directory, File} = require 'atom'
{$$} = require 'atom-space-pen-views'
ProcessConfig = require '../process-config'
ProcessOutputView = require '../views/process-output-view'
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

  runProcessWithFile: (filePath) ->
    if @process?
      return;

    @fields = {};
    @options = {};

    @fields.clipboard = atom.clipboard.read();
    @fields.configDirAbsPath = @configController.projectController.projectPath;
    @fields.stdout = "";
    @fields.stderr = "";

    projectPaths = atom.project.getPaths();

    if projectPaths.length > 0
      @fields.projectPath = projectPaths[0];
    else
      @fields.projectPath = @configController.projectController.projectPath;

    editor = atom.workspace.getActiveTextEditor();

    if editor
      @fields.selection = editor.getSelectedText();

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

  insertFields: (text) =>
    return text.replace(@replaceRegExp, @createReplaceCallback(@fields));

  createReplaceCallback: (fields) ->
    return (text) =>
      return fields[text.slice(1,-1)];

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
