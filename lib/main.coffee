ProcessListView = require './views/process-list-view'
ProjectController = require './controllers/project-controller'
{File, CompositeDisposable} = require 'atom'

module.exports = ProcessPalette =

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @projectControllers = []
    @processListView = new ProcessListView(@)
    @bottomPanel = atom.workspace.addBottomPanel(item: @processListView.getElement(), visible: false);

    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:toggle': => @toggle()
    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:reload': => @reload()

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

  reload: ->
    @processListView.showProcessList();
    
    for projectController in @projectControllers
      projectController.dispose();

    @projectControllers = [];
    @load();

  toggle: ->
    if @bottomPanel.visible
      @bottomPanel.hide();
    else
      @bottomPanel.show();

  show: ->
    if !@bottomPanel.visible
      @bottomPanel.show();

  hide: ->
    if @bottomPanel.visible
      @bottomPanel.hide();

  addProjectPath: (projectPath) ->
    projectController = new ProjectController(@processListView, projectPath);
    @projectControllers.push(projectController);

  removeProjectPath: (projectPath) ->
