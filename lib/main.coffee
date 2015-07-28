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

    configFile = new File(atom.config.getUserConfigPath());
    @addProjectPath(configFile.getParent().getRealPathSync());

    for projectPath in atom.project.getPaths()
      @addProjectPath(projectPath);

  deactivate: ->
    @processListView.destroy();
    @subscriptions.dispose();

    for projectController in projectControllers
      projectController.dispose();

  serialize: ->
    processPaletteViewState: @processListView.serialize()

  toggle: ->
    if @bottomPanel.visible
      @bottomPanel.hide();
    else
      @bottomPanel.show();

  show: ->
    if !@bottomPanel.visible
      @bottomPanel.show();

  addProjectPath: (projectPath) ->
    projectController = new ProjectController(@processListView, projectPath);
    @projectControllers.push(projectController);

  removeProjectPath: (projectPath) ->
