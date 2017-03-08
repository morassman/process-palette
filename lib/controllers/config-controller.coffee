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
    pattern_names = @config.patterns
    if not pattern_names?.length
      pattern_names = @projectController.processConfigs.defaultPatterns
    if not pattern_names?.length
      pattern_names = ['default']
    @patterns = @projectController.getPatterns(pattern_names);
    @lastTime = null;
    @disposables = new CompositeDisposable();

    cssSelector = 'atom-workspace';

    if (@config.outputTarget == 'editor')
      cssSelector = 'atom-text-editor';

    @disposables.add(atom.commands.add(cssSelector, @config.getCommandName(), @runProcess));

    if @config.keystroke
      binding = {};
      bindings = {};
      binding[@config.keystroke] = @config.getCommandName();
      bindings[cssSelector] = binding;
      atom.keymaps.add('process-palette', bindings);

    @addMenus();

  addMenus: ->
    if @config.menus.length == 0
      return;

    root = {};
    leaf = root;
    for menu in @config.menus
      child = {};
      leaf['label'] = menu;
      leaf['submenu'] = [child];
      leaf = child;

    leaf['label'] = _.humanizeEventName(@config.action);
    leaf['command'] = @config.getCommandName();
    @disposables.add(atom.menu.add([root]));

  getMain: ->
    return @projectController.getMain();

  getProjectController: ->
    return @projectController;

  getConfig: ->
    return @config;

  getLastTime: ->
    return @lastTime;

  saveFile: ->
    @projectController.saveFile();

  # Changes the command to execute. This is called when editing the command from the panel.
  setCommand: (command) ->
    @config.command = command;
    # @saveFile();

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
    @killRunningProcesses();
    @clearControllers();
    @disposables.dispose();

  clearControllers: ->
    for processController in @processControllers
      processController.dispose();

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

  # Returns a string describing the output target.
  getTargetDescription: ->
    if @config.stream
      return 'Stream to ' + @config.outputTarget;

    return 'Output to ' + @config.outputTarget;

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
