_ = require 'underscore-plus'
ProcessConfig = require './process-config'
{BufferedProcess, File} = require 'atom'

# Fields :
# stdout : Standard output.
# stderr : Standard error output.
# exitStatus : Code returned by command.
# projectAbsPath : Absolute path of project folder. - TODO
# clipboard : Text currently on clipboard.
# fullCommand : The full command along with its arguments.
#
# Only if a file is currently open :
# fileExt : Extention of file. - TODO
# fileName : Name of file without extention. - TODO
# fileNameExt : Name of file with extention.
# filePath : Path of file relative to project. - TODO
# fileAbsPath : Absolute path of file.
# selection : Currently selected text.

module.exports =
class ProcessController

  @config : null;
  @disposable : null;
  @process : null;
  @processStartedCallbacks : null;
  @processStoppedCallbacks : null;

  constructor: (@config) ->
    @processStartedCallbacks = [];
    @processStoppedCallbacks = [];
    @replaceRegExp = new RegExp('{.*?}','g');
    @fields = {};
    cssSelector = 'atom-workspace';

    if (@config.outputTarget == 'editor')
      cssSelector = 'atom-text-editor';
    else if (@config.outputTarget != 'clipboard')
      @config.outputTarget = 'console';

    @disposable = atom.commands.add(cssSelector, @config.getCommandName(), @runProcess);

    if @config.keystroke
      binding = {};
      bindings = {};
      binding[@config.keystroke] = @config.getCommandName();
      bindings[cssSelector] = binding;
      atom.keymaps.add('process-palette', bindings);

  dispose: ->
    @disposable.dispose();

  # Called from the command palette and also from the process panel. The =>, instead of ->, is important
  # so that 'this' can refer to the ProcessController. If it is -> then, when calling from the command palette,
  # this will reference the DOM node.
  runProcess: =>
    if @process
      return;

    @fields = {};
    @fields.clipboard = atom.clipboard.read();
    @fields.stdout = '';
    @fields.stderr = '';

    editor = atom.workspace.getActiveTextEditor();

    if editor
      file = new File(editor.getPath());
      @fields.fileNameExt = file.getBaseName();
      @fields.fileAbsPath = file.getRealPathSync();
      @fields.selection = editor.getSelectedText();
    else
      @fields.fileNameExt = '';
      @fields.fileAbsPath = '';
      @fields.selection = '';

    replaceCallback = @createReplaceCallback(@fields);
    command = @config.command.replace(@replaceRegExp, replaceCallback);

    args = [];
    for argument in @config.arguments
      args.push(argument.replace(@replaceRegExp, replaceCallback));

    @fields.fullCommand = command + " " + args.join(" ");

    stdout = (output) =>
      @fields.stdout += output;

    stderr = (output) =>
      @fields.stderr += output;

    exit = (exitStatus) =>
      @fields.exitStatus = exitStatus;
      @processExited();

    @process = new BufferedProcess({command, args, stdout, stderr, exit});
    @process.onWillThrowError(@handleProcessErrorCallback);
    @processStarted();

  insertFields: (text) =>
    return text.replace(@replaceRegExp, @createReplaceCallback(@fields));

  createReplaceCallback: (fields) ->
    return (text) =>
      return fields[text.slice(1,-1)];

  addProcessCallbacks: (processStartedCallback, processStoppedCallback) ->
    if (processStartedCallback)
      @processStartedCallbacks.push(processStartedCallback);

    if (processStoppedCallback)
      @processStoppedCallbacks.push(processStoppedCallback);

  handleProcessErrorCallback: (errorObject) =>
    # Indicate that the error has been handled.
    errorObject.handle();
    @processStopped(true);

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

  processExited: ->
    if @fields.exitStatus == 0
      formatted = @insertFields(@config.successOutput);
    else
      formatted = @insertFields(@config.errorOutput);

    editor = atom.workspace.getActiveTextEditor();

    if ((@config.outputTarget == 'editor') and editor)
      editor.insertText(formatted);
    else if (@config.outputTarget == 'clipboard')
      atom.clipboard.write(formatted);
    else
      console.log(formatted);

    @processStopped(false);

  processStarted: ->
    for processStartedCallback in @processStartedCallbacks
      processStartedCallback();

  processStopped: (fatal) =>
    message = _.humanizeEventName(@config.getCommandName());
    options = {};

    if fatal
      if @config.fatalMessage
        options["detail"] = @insertFields(@config.fatalMessage);
        atom.notifications.addError(message, options);
    else if @fields.exitStatus == 0
      if @config.successMessage
        options["detail"] = @insertFields(@config.successMessage);
        atom.notifications.addSuccess(message, options);
    else if @config.errorMessage
      options["detail"] = @insertFields(@config.errorMessage);
      atom.notifications.addWarning(message, options);

    @process = null;
    @fields = {};

    for processStoppedCallback in @processStoppedCallbacks
      processStoppedCallback();
