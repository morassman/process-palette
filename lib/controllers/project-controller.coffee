ProcessConfig = require '../process-config'
SaveController = require './save-controller'
ProcessController = require './process-controller'
{Directory, File, BufferedProcess, CompositeDisposable} = require 'atom'

module.exports =
class ProjectController

  constructor: (@main, @projectPath) ->
    @processControllers = [];
    @saveControllers = [];
    @configurationFile = new Directory(@projectPath).getFile('process-palette.json');
    @loadFile();

  dispose: ->
    @clearControllers();

  clearControllers: ->
    @clearProcessControllers();
    @clearSaveControllers();

  clearProcessControllers: ->
    for processController in @processControllers
      @main.mainView.removeProcess(processController);
      processController.dispose();

    @processControllers = [];

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

    if !processConfigs
      return;

    commands = processConfigs.commands;
    saveCommands = processConfigs.saveCommands;

    if commands
      for command in commands
        processController = new ProcessController(@, new ProcessConfig(command));
        @processControllers.push(processController);
        @main.mainView.addProcess(processController);

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

  getProcessController: (namespace, action) =>
    for processController in @processControllers
      if (processController.config.namespace == namespace) and (processController.config.action == action)
        return processController;

    return null;
