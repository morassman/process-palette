minimatch = require 'minimatch'

module.exports =
class SaveController

  constructor: (@main, @config) ->
    @configController = null;

  dispose: ->

  fileSaved: (path) =>
    if !minimatch(path, @config.pattern)
      return;

    if !@configController?
      @configController = @main.getConfigController(@config.namespace, @config.action);

    if @configController
      @configController.runProcessWithFile(path);
