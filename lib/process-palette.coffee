ProcessPaletteView = require './process-palette-view'
ProjectController = require './project-controller'
{CompositeDisposable} = require 'atom'
{File} = require 'atom'

module.exports = ProcessPalette =

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @projectControllers = []
    @processPaletteView = new ProcessPaletteView()
    @bottomPanel = atom.workspace.addBottomPanel(item: @processPaletteView.getElement(), visible: false);

    @subscriptions.add atom.commands.add 'atom-workspace', 'process-palette:toggle': => @toggle()

    configFile = new File(atom.config.getUserConfigPath());
    @addProjectPath(configFile.getParent().getRealPathSync());

    for projectPath in atom.project.getPaths()
      @addProjectPath(projectPath);

  deactivate: ->
    @processPaletteView.destroy();
    @subscriptions.dispose();

    for projectController in projectControllers
      projectController.dispose();

  serialize: ->
    processPaletteViewState: @processPaletteView.serialize()

  toggle: ->
    if (@bottomPanel.visible)
      @bottomPanel.hide();
    else
      @bottomPanel.show();

  addProjectPath: (projectPath) ->
    projectController = new ProjectController(@processPaletteView, projectPath);
    @projectControllers.push(projectController);

  removeProjectPath: (projectPath) ->
