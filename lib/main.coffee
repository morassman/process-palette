_ = require 'underscore-plus'
MainView = require './views/main-view'
ProjectController = require './controllers/project-controller'
{File, CompositeDisposable} = require 'atom'

module.exports = ProcessPalette =

  activate: (@state) ->
    @subscriptions = new CompositeDisposable
    @projectControllers = []
    @mainView = new MainView(@)
    @bottomPanel = atom.workspace.addBottomPanel(item: @mainView.getElement(), visible: false);

    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:show': => @showPanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:hide': => @hidePanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:toggle': => @togglePanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:edit-configuration': => @editConfiguration()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:reload-configuration': => @reloadConfiguration()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'core:cancel': => @hidePanel()
      'core:close': => @hidePanel()

    # TODO : Enable this again later to support 'on-save' behavior.
    # @subscriptions.add atom.workspace.observeTextEditors (editor) =>
    #   @subscriptions.add editor.onDidSave (event) =>
    #     @fileSaved(event.path);

    @load();

    if _.isNumber(@state.height)
      @mainView.setViewHeight(@state.height);

    if @state.visible
      @bottomPanel.show();

  deactivate: ->
    @subscriptions.dispose();
    @disposeProjectControllers();
    @mainView.destroy();

  disposeProjectControllers: ->
    for projectController in @projectControllers
      projectController.dispose();

  serialize: ->
    if @mainView != null
      state = {};
      state.visible = @bottomPanel.isVisible();
      state.height = @mainView.viewHeight;
      return state;

    return @state;

  fileSaved: (path) ->
    for projectController in @projectControllers
      projectController.fileSaved(path);

  load: ->
    configFile = new File(atom.config.getUserConfigPath());
    @addProjectPath(configFile.getParent().getRealPathSync());

    for projectPath in atom.project.getPaths()
      @addProjectPath(projectPath);

  reloadConfiguration: ->
    if @mainView.isOutputViewVisible()
      @mainView.showListView();

    for projectController in @projectControllers
      projectController.dispose();

    @projectControllers = [];
    @load();

    atom.notifications.addInfo("Process Palette configurations reloaded");

  togglePanel: ->
    if @bottomPanel.visible
      @bottomPanel.hide();
    else
      @bottomPanel.show();

  showPanel: ->
    if !@bottomPanel.visible
      @bottomPanel.show();

  hidePanel: ->
    if @bottomPanel.visible
      @bottomPanel.hide();

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
    projectController = new ProjectController(@, projectPath);
    @projectControllers.push(projectController);

  editConfiguration: ->
    for projectController in @projectControllers
      projectController.editConfiguration();

  getConfigController: (namespace, action) ->
    for projectController in @projectControllers
      configController = projectController.getConfigController(namespace, action);

      if processController
        return processController;

    return null;
