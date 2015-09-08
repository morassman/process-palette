ProcessView = require './process-view'
ProcessOutputView = require './process-output-view'
{$$, View} = require 'atom-space-pen-views'

module.exports =
class ProcessListView extends View

  constructor: (@main) ->
    super(@main);
    @processViews = [];

  @content: ->
    @div {class:"process-palette-process-list"}, =>
      @div {class:"process-palette-scrollable", outlet:"processList"}

  addConfigController: (configController) =>
    processView = new ProcessView(@main, configController);
    @processViews.push(processView);

    @processList.append $$ ->
      @div =>
        @subview configController.config.id, processView

  removeConfigController: (configController) =>
    processView = @getProcessView(configController);

    if processView
      index = @processViews.indexOf(processView);
      @processViews.splice(index, 1);
      processView.destroy();

  getProcessView: (configController) =>
    for processView in @processViews
      if processView.configController == configController
        return processView;

    return null;

  showProcessOutput: (processController) =>
    @main.showProcessOutput(processController);

  serialize: ->

  destroy: ->
    @element.remove();

  getElement: ->
    @element

  parentHeightChanged: (parentHeight) ->
    @processList.height(parentHeight);
