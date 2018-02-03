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
    @disposables = new CompositeDisposable();
    @ctxMenuDisposables = null;

    cssSelector = 'atom-workspace';

    if (@config.outputTarget == 'editor')
      cssSelector = 'atom-text-editor';

    @disposables.add(atom.commands.add(cssSelector, @config.getCommandName(), @runProcess));

    if @config.keystroke
      binding = {};
      bindings = {};
      binding[@config.keystroke] = @config.getCommandName();
      bindings[cssSelector] = binding;
      atom.keymaps.add(@config.getCommandName(), bindings);

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

  # Adds a menu item to the tree-view's context menu to run this command with
  # the selected path in the tree view. An item is only added if this command
  # takes a file as input.
  recreateTreeViewMenuItem: ->
    @disposeTreeViewMenuItem();

    if !@inputUsesFileVariables()
      return;

    # Create a command that will run this process with the tree view's selected path.
    commandName = 'tree-view-run-with:' + @config.action;

    @ctxMenuDisposables = new CompositeDisposable();
    @ctxMenuDisposables.add(atom.commands.add('atom-workspace', commandName, () => @runProcessFromTreeView()));
    shouldEnable = () => @shouldTreeViewMenuEnable();

    # NB. Notice that the function assigned to 'created' uses '->' instead of '=>'.
    # This is so that @ points to the menu item and not ConfigController.

    root = {
      label: 'Run With',
      submenu: [
        {
          label: _.humanizeEventName(@config.action),
          command: commandName,
          created: () -> @.enabled = shouldEnable()
        }
      ]
    };

    @ctxMenuDisposables.add(atom.contextMenu.add({'.tree-view': [root]}));

  # This is called when the command was edited directly from the panel.
  # If the command previously didn't depend on a file and does now, then
  # a context menu item will be created for it. If the command did depend
  # on a file, but now doesn't anymore then the menu item is removed.
  recreateTreeViewMenuItemIfNeeded: ->
    hasCtxMenu = @ctxMenuDisposables?;
    usesFileVars = @inputUsesFileVariables();

    # Do nothing if there is already a menu item and it is still needed.
    if hasCtxMenu and !usesFileVars
      @disposeTreeViewMenuItem();
    else if !hasCtxMenu and usesFileVars
      @projectController.main.recreateTreeViewContextMenu();

  shouldTreeViewMenuEnable: ->
    return document.querySelectorAll(".tree-view .selected").length > 0;

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
    @getMain().setDirty(true);
    @recreateTreeViewMenuItemIfNeeded();
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
    @disposeTreeViewMenuItem();
    @disposables.dispose();

  disposeTreeViewMenuItem: ->
    @ctxMenuDisposables?.dispose();
    @ctxMenuDisposables = null;

  clearControllers: ->
    for processController in @processControllers
      processController.dispose();

  runProcess: =>
    filePath = null;
    textEditor = atom.workspace.getActiveTextEditor();

    if textEditor?
      filePath = textEditor.getPath();

    # Do not run the command if it depends on a file when there isn't one.
    if !filePath? and @inputUsesFileVariables()
      notifOptions = {};
      notifOptions["dismissable"] = true;

      # filePath is null if there aren't any text editors.
      # filePath is undefined if there is a text editor open, but it hasn't been saved before.
      if filePath == null
        notifOptions["detail"] = "This command requires an open file to be active in the workspace.";
      else
        notifOptions["detail"] = "The file needs to be saved before this command can be executed on it.";

      atom.notifications.addWarning("Cannot execute #{@config.getHumanizedCommandName()}", notifOptions);
      return;

    @runProcessWithFile(filePath);

  runProcessFromTreeView: ->
    selected = document.querySelectorAll(".tree-view .selected > .list-item > .name, .tree-view .selected > .name")
    if selected.length > 0
      @runProcessWithFile(selected[0].dataset.path);

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
      processController.hasBeenRemoved();
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

  # Return true if any of the inputs use any of the {file*} variables.
  inputUsesFileVariables: ->
    r = new RegExp("{file.*?}","g");

    if r.test(@config.command) || r.test(@config.cwd)
      return true;

    if @config.env?
      for key, val of @config.env
        if r.test(val)
          return true;

    if @config.input? and r.test(@config.input)
      return true;

    return false;

  # Returns a string describing the output target.
  getTargetDescription: ->
    if @config.stream
      return 'Stream to ' + @config.outputTarget;

    return 'Output to ' + @config.outputTarget;

  guiEdit: ->
    @getMain().guiEditCommand(@);

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
