minimatch = require 'minimatch'

module.exports =
class SaveController

  constructor: (@main, @config) ->
    @processController = null;

  dispose: ->

  fileSaved: (path) =>
    if !minimatch(path, @config.pattern)
      return;

    if !@processController
      @processController = @main.getProcessController(@config.namespace, @config.action);

    if @processController
      @processController.runProcess(path);
