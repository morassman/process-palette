_ = require 'underscore-plus'
ProcessConfig = require '../process-config'
SaveController = require './save-controller'
ProcessController = require './process-controller'
{Directory, File, BufferedProcess, CompositeDisposable} = require 'atom'

module.exports =
class ConfigController

  constructor: (@projectController, @config) ->
    @processControllers = [];
    @listeners = [];

  getFirstProcessController: ->
    if @processControllers.length == 0
      return null;

    return @processControllers[0];

  addListener: (listener) ->
    @listeners.push(listener);

  removeListener: (listener) ->
    index = @listeners.indexOf(listener);

    if (index != -1)
      @listeners.splice(index, 1);

  dispose: ->
    @clearControllers();

  clearControllers: ->
    for processController in @processControllers
      processController.dispose();

    @processControllers = [];

  runProcess: ->
    processController = new ProcessController(@, @config);
    @processControllers.push(processController);
    processController.runProcess();

    return processController;

  runProcessWithFile: (filePath) ->
    processController = new ProcessController(@, @config);
    @processControllers.push(processController);
    processController.runProcessWithFile(filePath);

    return processController;

  removeProcessController: (processController) ->
    index = @processControllers.indexOf(processController);

    if (index != -1)
      @processControllers.splice(index, 1);
      @notifyProcessControllerRemoved(processController);

  removeOldest: ->
    if !@config.maxCompleted?
      return;

    oldest = null;
    count = 0;

    for i in [(@processControllers.length-1)..0]
      if @processControllers[i].endTime != null
        count++;
        if (oldest == null) or (@processControllers[i].endTime < oldest.endTime)
          oldest = @processControllers[i];

    if count <= @config.maxCompleted
      return;

    if oldest != null
      @removeProcessController(oldest);

  notifyProcessStarted: (processController) ->
    _.invoke(_.clone(@listeners), "processStarted", processController);

  notifyProcessStopped: (processController) ->
    @removeOldest();
    _.invoke(_.clone(@listeners), "processStopped", processController);

  notifyProcessControllerRemoved: (processController) ->
    _.invoke(_.clone(@listeners), "processControllerRemoved", processController);
