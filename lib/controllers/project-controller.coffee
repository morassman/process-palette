ProcessConfig = require '../process-config'
SaveController = require './save-controller'
ConfigController = require './config-controller'
ProcessController = require './process-controller'
{Directory, File, BufferedProcess, CompositeDisposable} = require 'atom'

module.exports =
class ProjectController

  constructor: (@main, @projectPath) ->
    @configControllers = [];
    @saveControllers = [];
    @configurationFile = new Directory(@projectPath).getFile('process-palette.json');
    @loadFile();

  getMain: ->
    return @main;

  dispose: ->
    @clearControllers();

  clearControllers: ->
    @clearConfigControllers();
    @clearSaveControllers();

  clearConfigControllers: ->
    for configController in @configControllers
      @main.mainView.removeConfigController(configController);
      configController.dispose();

    @configControllers = [];

  clearSaveControllers: ->
    for saveController in @saveControllers
      saveController.dispose();

    @saveControllers = [];

  loadFile: ->
    @clearControllers();

    if (!@configurationFile.isFile() or !@configurationFile.existsSync())
      return;

    @configurationFile.read(true).then (resolve) =>
      @parseFile(resolve);

  parseFile: (content) ->
    processConfigs = JSON.parse(content);

    if !processConfigs?
      return;

    commands = processConfigs.commands;
    saveCommands = processConfigs.saveCommands;

    if commands
      for command in commands
        configController = new ConfigController(@, new ProcessConfig(command));
        @configControllers.push(configController);
        @main.mainView.addConfigController(configController);

    if saveCommands
      for saveCommand in saveCommands
        saveController = new SaveController(@main, saveCommand);
        @saveControllers.push(saveController);

  editConfiguration: ->
    if (@configurationFile.isFile() and @configurationFile.existsSync())
      atom.workspace.open(@configurationFile.getPath());

  fileSaved: (path) =>
    for saveController in @saveControllers
      saveController.fileSaved(path);

  getConfigController: (namespace, action) =>
    for configController in @configControllers
      if (configController.config.namespace == namespace) and (configController.config.action == action)
        return configController;

    return null;
