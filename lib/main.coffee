_ = require 'underscore-plus'
{Directory, File, CompositeDisposable} = require 'atom'
MainView = require './views/main-view'
TreeViewController = require './controllers/tree-view-controller'

Path = null
ConfigsView = null
MainEditView = null
ProjectController = null

module.exports = ProcessPalette =

  config:
    shell:
      description: "The shell to run commands with. Leave empty for system default to be used."
      type: "string"
      default: ""
    palettePanel:
      type: "object"
      properties:
        showCommand:
          title: "Show command"
          description: "Show the configured command in the palette panel"
          type: "boolean"
          default: true
        showOutputTarget:
          title: "Show output target"
          description: "Show the configured output target in the palette panel"
          type: "boolean"
          default: true

  activate: (@state) ->
    @dirty = false;
    @subscriptions = new CompositeDisposable();
    @projectControllers = [];
    @mainView = new MainView(@);
    @treeViewController = new TreeViewController(@);
    # @bottomPanel = atom.workspace.addBottomPanel(item: @mainView.getElement(), visible: false);

    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:show': => @showPanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:hide': => @hidePanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:toggle': => @togglePanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:rerun-last': => @runLast()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:kill-focused-process': => @mainView.killFocusedProcess(false)
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:kill-and-remove-focused-process': => @mainView.killFocusedProcess(true)
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:remove-focused-output': => @mainView.discardFocusedOutput()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:edit-configuration': => @editConfiguration()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:reload-configuration': => @reloadConfiguration()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'core:cancel': => @hidePanel()
      'core:close': => @hidePanel()

    # TODO : Enable this again later to support 'on-save' behavior.
    # @subscriptions.add atom.workspace.observeTextEditors (editor) =>
    #   @subscriptions.add editor.onDidSave (event) =>
    #     @fileSaved(event.path);

    # if _.isNumber(@state.height)
      # @mainView.setViewHeight(@state.height);

    atom.workspace.addOpener (uri) =>
      if uri == MainView.URI
        return @mainView;

    if @state.visible
      @showPanel(false);

    process.nextTick () => @load()

  deactivate: ->
    @subscriptions.dispose();
    @disposeProjectControllers();
    @treeViewController.dispose();
    @mainView.deactivate();

  disposeProjectControllers: ->
    for projectController in @projectControllers
      projectController.dispose();

  serialize: ->
    if @mainView != null
      state = {};
      state.visible = @getDock() != null;
      return state;

    return @state;

  fileSaved: (path) ->
    for projectController in @projectControllers
      projectController.fileSaved(path);

  load: ->
    # Remove all key bindings.
    atom.keymaps.removeBindingsFromSource('process-palette');

    configFile = new File(atom.config.getUserConfigPath());
    @addProjectPath(configFile.getParent().getRealPathSync());

    for projectPath in atom.project.getPaths()
      @addProjectPath(projectPath);

    atom.project.onDidChangePaths (paths) => @projectsChanged(paths)

  projectsChanged: (paths) ->
    # Add controllers for new project paths.
    for path in paths
      if @getProjectControllerWithPath(path) == null
        @addProjectPath(path);

    # Remove controllers of old project paths.
    toRemove = [];
    for projectCtrl in @projectControllers
      if !projectCtrl.isGlobal() and paths.indexOf(projectCtrl.getProjectPath()) < 0
        toRemove.push(projectCtrl);

    if toRemove.length == 0
      return;

    for projectCtrl in toRemove
      @removeProjectController(projectCtrl);

  getProjectControllerWithPath: (projectPath) ->
    for projectController in @projectControllers
      if projectController.getProjectPath() == projectPath
        return projectController;

    return null;

  reloadConfiguration: (saveEditors = true) ->
    @treeViewController.dispose();
    @treeViewController = new TreeViewController(@);

    if saveEditors
      @saveEditors();

    if @mainView.isOutputViewVisible()
      @mainView.showListView();

    for projectController in @projectControllers
      projectController.dispose();

    @projectControllers = [];
    @load();

    atom.notifications.addInfo("Process Palette configurations reloaded");

  togglePanel: ->
    if @isVisibleInDock()
      @hidePanel()
    else
      @showPanel();

  showPanel: (activate = true) ->
    atom.workspace.open(MainView.URI, {
      searchAllPanes: true,
      activatePane: activate,
      activateItem: activate
    });

  hidePanel: ->
    atom.workspace.hide(@mainView);

  isVisible: ->
    return @isVisibleInDock();

  isVisibleInDock: ->
    dock = @getDock();

    if !dock? or !dock.isVisible()
      return false;

    if !dock.getActivePane()?
      return false;

    return dock.getActivePane().getActiveItem() is @mainView;

  getDock: ->
    if atom.workspace.getBottomDock().getPaneItems().indexOf(@mainView) >= 0
      return atom.workspace.getBottomDock();
    if atom.workspace.getLeftDock().getPaneItems().indexOf(@mainView) >= 0
      return atom.workspace.getLeftDock();
    if atom.workspace.getRightDock().getPaneItems().indexOf(@mainView) >= 0
      return atom.workspace.getRightDock();

    return null;

  runLast: ->
    configController = @getLastRunConfigController();
    configController?.runProcess();

  showListView: ->
    @showPanel();
    @mainView.showListView();

  showProcessOutput: (processController) ->
    @showPanel();
    @mainView.showProcessOutput(processController);

  isProcessOutputShown: (processController) ->
    return @mainView.isProcessOutputShown(processController);

  processControllerRemoved: (processController) ->
    @mainView.processControllerRemoved(processController);

  addProjectPath: (projectPath) ->
    file = new Directory(projectPath).getFile('process-palette.json');

    if !file.existsSync()
      return;

    ProjectController ?= require './controllers/project-controller'
    projectController = new ProjectController(@, projectPath);
    @projectControllers.push(projectController);
    @mainView.addProjectView(projectController.view);

  removeProjectController: (projectController) ->
    index = @projectControllers.indexOf(projectController);

    if index < 0
      return;

    @projectControllers.splice(index, 1);
    projectController.dispose();

  editConfiguration: (showGlobal = true) ->
    ConfigsView ?= require './views/configs-view'
    view = new ConfigsView(@, showGlobal);
    # for projectController in @projectControllers
    #   projectController.editConfiguration();

  guiEditConfiguration: (global, projectName, folderPath) ->
    if global
      title = 'Global Commands';
    else
      title = projectName;

    Path ?= require 'path'

    # If there is a process-palette.json file then open it. If not then
    # create a new file and load the example into it.
    file = new File(Path.join(folderPath, 'process-palette.json'));

    if !file.existsSync()
      packagePath = atom.packages.getActivePackage('process-palette').path;
      exampleFile = new File(Path.join(packagePath, 'examples', 'process-palette.json'));

      exampleFile.read(false).then (content) =>
        file.create().then =>
          file.writeSync(content);
          @addProjectPath(folderPath);
          @guiOpenFile(title, file);
    else
      @guiOpenFile(title, file);

  guiEditCommand: (configController) ->
    projectController = configController.getProjectController();
    file = projectController.getConfigurationFile();
    action = configController.getConfig().action;

    if projectController.isGlobal()
      title = 'Global Commands';
    else
      title = projectController.getProjectName();

    @guiOpenFile(title, file, action);

  guiOpenFile: (title, file, selectedAction = null) ->
    MainEditView ?= require './views/edit/main-edit-view'

    # If the file is already open then activate its pane.
    filePath = file.getRealPathSync();
    paneItem = @getPaneItem(filePath);

    if paneItem?
      pane = atom.workspace.paneForItem(paneItem);
      pane.activateItem(paneItem);
      return;

    main = @;

    file.read(false).then (content) =>
      config = JSON.parse(content);
      if !_.isObject(config.patterns)
        config.patterns = {};
      if !_.isArray(config.commands)
        config.commands = [];

      view = new MainEditView(main, title, filePath, config, selectedAction);
      pane = atom.workspace.getCenter().getActivePane();
      paneItem = pane.addItem(view, {index: 0});
      pane.activateItem(paneItem);

  # Called when the save button was pressed. This saves changes that were made
  # to the command directly in the panel.
  savePanel: ->
    for projectController in @projectControllers
      projectController.saveFile();

    @setDirty(false);

  saveEditors: ->
    MainEditView ?= require './views/edit/main-edit-view'
    paneItems = atom.workspace.getPaneItems();

    for paneItem in paneItems
      if paneItem instanceof MainEditView
        paneItem.saveChanges();

    @setDirty(false);

  getPaneItem: (filePath) ->
    MainEditView ?= require './views/edit/main-edit-view'
    paneItems = atom.workspace.getPaneItems();

    for paneItem in paneItems
      if paneItem instanceof MainEditView
        if paneItem.filePath == filePath
          return paneItem;

    return null;

  getConfigController: (namespace, action) ->
    for projectController in @projectControllers
      configController = projectController.getConfigController(namespace, action);

      if processController
        return processController;

    return null;

  getLastRunConfigController: ->
    result = null;
    configControllers = @getAllConfigControllers();

    for configController in configControllers
      lastTime = configController.getLastTime();

      if lastTime?
        if !result? or result.getLastTime() < lastTime
          result = configController;

    return result;

  getAllConfigControllers: ->
    result = [];

    for projectController in @projectControllers
      result = result.concat(projectController.getConfigControllers());

    return result;

  setDirty: (dirty) ->
    if @dirty != dirty
      @dirty = dirty;
      @mainView.setSaveButtonVisible(@dirty);

  recreateTreeViewContextMenu: ->
    @treeViewController.recreateContextMenu();
