ProcessConfig = require '../process-config'
ProcessController = require './process-controller'
{BufferedProcess, CompositeDisposable} = require 'atom'
{Directory, File} = require 'atom'

module.exports =
class ProjectController

  constructor: (@mainView, @projectPath) ->
    @processControllers = [];
    @configurationFile = new Directory(@projectPath).getFile('process-palette.json');
    @loadFile();

  dispose: ->
    @clearProcessControllers();

  clearProcessControllers: ->
    for processController in @processControllers
      @mainView.removeProcess(processController);
      processController.dispose();

    processControllers = [];

  loadFile: (projectPath) ->
    @clearProcessControllers();

    if (!@configurationFile.isFile() or !@configurationFile.existsSync())
      return;

    promise = @configurationFile.read(true);

    promise.then (resolve) =>
      @parseFile(resolve);

  parseFile: (content) ->
    processConfigs = JSON.parse(content);

    if !processConfigs
      return;

    commands = processConfigs.commands;

    if !commands
      return;

    for command in commands
      processController = new ProcessController(@, new ProcessConfig(command));
      @processControllers.push(processController);
      @mainView.addProcess(processController);

  editConfiguration: ->
    if (!@configurationFile.isFile() or !@configurationFile.existsSync())
      return;

    atom.workspace.open(@configurationFile.getPath());
