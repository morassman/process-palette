_ = require 'underscore-plus'
ProcessConfig = require '../process-config'
{BufferedProcess, Directory, File} = require 'atom'

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

  constructor: (@projectController, @config) ->
    @processCallbacks = [];
    @replaceRegExp = new RegExp('{.*?}','g');
    @fields = {};
    @output = '';
    cssSelector = 'atom-workspace';

    if (@config.outputTarget == 'editor')
      cssSelector = 'atom-text-editor';

    @disposable = atom.commands.add(cssSelector, @config.getCommandName(), @runProcess);

    if @config.keystroke
      binding = {};
      bindings = {};
      binding[@config.keystroke] = @config.getCommandName();
      bindings[cssSelector] = binding;
      atom.keymaps.add('process-palette', bindings);

  dispose: ->
    @disposable.dispose();

  runProcess: =>
    if @process
      return;

    @fields = {};
    options = {};

    @fields.clipboard = atom.clipboard.read();
    @fields.configDirAbsPath = @projectController.projectPath;
    @fields.stdout = '';
    @fields.stderr = '';

    projectPaths = atom.project.getPaths();

    if projectPaths.length > 0
      @fields.projectPath = projectPaths[0];
    else
      @fields.projectPath = @projectController.projectPath;

    editor = atom.workspace.getActiveTextEditor();

    if editor
      file = new File(editor.getPath());
      @fields.selection = editor.getSelectedText();

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
      @fields.fileName = '';
      @fields.fileExt = '';
      @fields.fileNameExt = '';
      @fields.fileAbsPath = '';
      @fields.fileDirAbsPath = '';
      @fields.filePath = '';
      @fields.fileDirPath = '';
      @fields.fileProjectPath = '';
      @fields.selection = '';

    if @config.cwd
      options.cwd = @insertFields(@config.cwd);
    else
      options.cwd = @fields.projectPath;

    command = @insertFields(@config.command);

    args = [];
    for argument in @config.arguments
      args.push(@insertFields(argument));

    @fields.fullCommand = command;

    if args.length > 0
      @fields.fullCommand += " " + args.join(" ");

    stdout = (output) =>
      @fields.stdout += output;

    stderr = (output) =>
      @fields.stderr += output;

    exit = (exitStatus) =>
      @fields.exitStatus = exitStatus;
      @processStopped(false);

    @process = new BufferedProcess({command, args, options, stdout, stderr, exit});
    @process.onWillThrowError(@handleProcessErrorCallback);
    @processStarted();

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

  runKillProcess: ->
    if @process
      @killProcess();
    else
      @runProcess();

  killProcess:  ->
    if !@process
      return;

    @process.kill();
    @processStopped(false);

  handleProcessErrorCallback: (errorObject) =>
    # Indicate that the error has been handled.
    errorObject.handle();
    @processStopped(true);

  processStarted: ->
    for processCallback in @processCallbacks
      if typeof processCallback.processStarted is 'function'
        processCallback.processStarted();

  processStopped: (fatal) =>
    output = '';
    @output = '';
    messageTitle = _.humanizeEventName(@config.getCommandName());
    options = {};

    if fatal
      if @config.fatalOutput
        output = @insertFields(@config.fatalOutput);

      if @config.fatalMessage
        options["detail"] = @insertFields(@config.fatalMessage);
        atom.notifications.addError(messageTitle, options);
    else if @fields.exitStatus == 0
      if @config.successOutput
        output = @insertFields(@config.successOutput);

      if @config.successMessage
        options["detail"] = @insertFields(@config.successMessage);
        atom.notifications.addSuccess(messageTitle, options);
    else
      if @config.errorOutput
        output = @insertFields(@config.errorOutput);

      if @config.errorMessage
        options["detail"] = @insertFields(@config.errorMessage);
        atom.notifications.addWarning(messageTitle, options);

    if (@config.outputTarget == 'editor')
      editor = atom.workspace.getActiveTextEditor();

      if editor
        editor.insertText(output);
    else if (@config.outputTarget == 'clipboard')
      atom.clipboard.write(output);
    else if (@config.outputTarget == 'console')
      console.log(output);
    else if (@config.outputTarget == 'panel')
      @output = output;

    @process = null;
    @fields = {};

    for processCallback in @processCallbacks
      if typeof processCallback.processStopped is 'function'
        processCallback.processStopped();
