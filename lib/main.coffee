MainView = require './views/main-view'
ProjectController = require './controllers/project-controller'
{File, CompositeDisposable} = require 'atom'

module.exports = ProcessPalette =

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @projectControllers = []
    @mainView = new MainView(@)
    @bottomPanel = atom.workspace.addBottomPanel(item: @mainView.getElement(), visible: false);

    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:toggle': => @togglePanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:edit-configuration': => @editConfiguration()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:reload-configuration': => @reloadConfiguration()

    @load();

  deactivate: ->
    @subscriptions.dispose();
    @disposeProjectControllers();
    @mainView.destroy();

  disposeProjectControllers: ->
    for projectController in projectControllers
      projectController.dispose();

  serialize: ->
    processPaletteViewState: @mainView.serialize()

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

  addProjectPath: (projectPath) ->
    projectController = new ProjectController(@mainView, projectPath);
    @projectControllers.push(projectController);

  editConfiguration: ->
    for projectController in @projectControllers
      projectController.editConfiguration();
