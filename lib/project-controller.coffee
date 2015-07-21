ProcessConfig = require './process-config'
ProcessController = require './process-controller'
{CompositeDisposable} = require 'atom'
{BufferedProcess} = require 'atom'
{File} = require 'atom'

module.exports =
class ProjectController
  @filePath = null;
  @processControllers = null;

  constructor: (@projectPath) ->
    @processControllers = [];
    @filePath = projectPath+'/process-palette.json';
    @loadFile();

  dispose: ->
    @clearProcessControllers();

  clearProcessControllers: ->
    for processController in @processControllers
      processController.dispose();

    processControllers = [];

  loadFile: ->
    @clearProcessControllers();

    file = new File(@filePath, false);

    if (!file.isFile() or !file.existsSync())
      console.log('process-palette.json not found.');
      return;

    promise = file.read(true);

    promise.then (resolve) =>
      console.log('parseFile1');
      @parseFile(resolve);
      console.log('parseFile2');

  parseFile: (resolve) ->
    console.log('parseFile');
    processConfigs = JSON.parse(resolve);

    for id, processConfig of processConfigs
      processConfig.id = id;
      processController = new ProcessController(new ProcessConfig(processConfig));
      @processControllers.push(processController);
