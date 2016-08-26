_ = require 'underscore-plus'
ProcessConfig = require '../process-config'
SaveController = require './save-controller'
ProcessController = require './process-controller'
{Directory, File, BufferedProcess, CompositeDisposable} = require 'atom'

module.exports =
class ConfigController

  constructor: (@projectController, @config) ->
    @processControllers = [];
    @listeners = [];
    @patterns = @projectController.getPatterns(@config.patterns);
    @lastTime = null;

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

  getMain: ->
    return @projectController.getMain();

  getLastTime: ->
    return @lastTime;

  getFirstProcessController: ->
    if @processControllers.length == 0
      return null;

    return @processControllers[0];

  addListener: (listener) ->
    @listeners.push(listener);

  removeListener: (listener) ->
    index = @listeners.indexOf(listener);

    if (index != -1)
      @listeners.splice(index, 1);

  dispose: ->
    @clearControllers();
    @disposable.dispose();

  clearControllers: ->
    for processController in @processControllers
      processController.dispose();

    @processControllers = [];

  runProcess: =>
    filePath = null;
    pane = atom.workspace.getActivePaneItem();

    if typeof pane?.getPath is "function"
      filePath = pane.getPath();

    @runProcessWithFile(filePath);

  runProcessWithFile: (filePath) ->
    if @config.singular
      @killRunningProcesses();

    processController = new ProcessController(@, @config);
    processController.runProcessWithFile(filePath)

  killRunningProcesses: ->
    clone = @processControllers.slice(0);
    for pc in clone
      pc.killProcess();

  removeProcessController: (processController) ->
    processController.dispose();
    index = @processControllers.indexOf(processController);

    if (index != -1)
      @processControllers.splice(index, 1);
      @notifyProcessControllerRemoved(processController);

  removeOldest: ->
    if !@config.maxCompleted?
      return;

    oldest = null;
    count = 0;

    for i in [(@processControllers.length-1)..0]
      if @processControllers[i].endTime != null
        count++;
        if (oldest == null) or (@processControllers[i].endTime < oldest.endTime)
          oldest = @processControllers[i];

    if count <= @config.maxCompleted
      return;

    if oldest != null
      @removeProcessController(oldest);

  autoHideOutput: (processController) ->
    # Check to see if autoHideOutput is true.
    if !processController.config.autoHideOutput
      return;

    main = @projectController.getMain();

    # Only hide if this process' output is being shown.
    if !main.isProcessOutputShown(processController)
      return;

    # Only hide if the process wasn't killed and exited successfully.
    if processController.isKilled() or (processController.getExitStatus() != 0)
      return;

    main.hidePanel();

  notifyProcessStarted: (processController) ->
    @processControllers.push(processController);
    @lastTime = new Date().getTime();
    _.invoke(_.clone(@listeners), "processStarted", processController);

  notifyProcessStopped: (processController) ->
    @autoHideOutput(processController);
    @removeOldest();
    _.invoke(_.clone(@listeners), "processStopped", processController);

    if @config.outputTarget != "panel" and @config.outputTarget != "file"
      @removeProcessController(processController);

  notifyProcessControllerRemoved: (processController) ->
    _.invoke(_.clone(@listeners), "processControllerRemoved", processController);
