ProcessConfig = require './process-config'
ProcessController = require './process-controller'
{CompositeDisposable} = require 'atom'
{BufferedProcess} = require 'atom'
{Directory, File} = require 'atom'

module.exports =
class ProjectController

  constructor: (@processPaletteView, projectPath) ->
    @processControllers = [];
    @loadFile(projectPath);

  dispose: ->
    @clearProcessControllers();

  clearProcessControllers: ->
    for processController in @processControllers
      processController.dispose();

    processControllers = [];

  loadFile: (projectPath) ->
    @clearProcessControllers();

    file = new Directory(projectPath).getFile('process-palette.json');

    if (!file.isFile() or !file.existsSync())
      return;

    promise = file.read(true);

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
      processController = new ProcessController(new ProcessConfig(command));
      @processControllers.push(processController);
      @processPaletteView.addProcess(processController);
