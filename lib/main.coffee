ProcessListView = require './views/process-list-view'
ProjectController = require './controllers/project-controller'
{File, CompositeDisposable} = require 'atom'

module.exports = ProcessPalette =

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @projectControllers = []
    @processListView = new ProcessListView(@)
    @bottomPanel = atom.workspace.addBottomPanel(item: @processListView.getElement(), visible: false);

    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:toggle': => @togglePanel()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:edit-configuration': => @editConfiguration()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:reload-configuration': => @reloadConfiguration()

    @load();

  deactivate: ->
    @processListView.destroy();
    @subscriptions.dispose();
    @disposeProjectControllers();

  disposeProjectControllers: ->
    for projectController in projectControllers
      projectController.dispose();

  serialize: ->
    processPaletteViewState: @processListView.serialize()

  load: ->
    configFile = new File(atom.config.getUserConfigPath());
    @addProjectPath(configFile.getParent().getRealPathSync());

    for projectPath in atom.project.getPaths()
      @addProjectPath(projectPath);

  reloadConfiguration: ->
    @processListView.showProcessList();

    for projectController in @projectControllers
      projectController.dispose();

    @projectControllers = [];
    @load();

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

  addProjectPath: (projectPath) ->
    projectController = new ProjectController(@processListView, projectPath);
    @projectControllers.push(projectController);

  editConfiguration: ->
    for projectController in @projectControllers
      projectController.editConfiguration();
