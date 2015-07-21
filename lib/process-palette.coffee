ProcessPaletteView = require './process-palette-view'
ProjectController = require './project-controller'
{CompositeDisposable} = require 'atom'
{File} = require 'atom'

module.exports = ProcessPalette =

  processPaletteView: null
  modalPanel: null
  subscriptions: null
  disposables: null
  projectControllers: null

  activate: (state) ->
    @processPaletteView = new ProcessPaletteView(state.processPaletteViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @processPaletteView.getElement(), visible: false)
    @subscriptions = new CompositeDisposable
    @projectControllers = []

    @subscriptions.add atom.commands.add 'atom-workspace', 'Process Palette:Sandbox': => @sandbox()

    configFile = new File(atom.config.getUserConfigPath());
    @addProjectPath(configFile.getParent().getRealPathSync());

    for projectPath in atom.project.getPaths()
      @addProjectPath(projectPath);

  deactivate: ->
    @modalPanel.destroy();
    @processPaletteView.destroy();
    @subscriptions.dispose();

    for projectController in projectControllers
      projectController.dispose();

  serialize: ->
    processPaletteViewState: @processPaletteView.serialize()

  sandbox: ->

  addProjectPath: (projectPath) ->
    console.log('addProjectPath : '+projectPath);
    projectController = new ProjectController(projectPath);
    @projectControllers.push(projectController);

  removeProjectPath: (projectPath) ->
    console.log('removeProjectPath : '+projectPath);
