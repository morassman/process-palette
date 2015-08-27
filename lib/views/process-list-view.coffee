ProcessView = require './process-view'
ProcessOutputView = require './process-output-view'
{CompositeDisposable} = require 'atom'
{$$, View} = require 'atom-space-pen-views'

module.exports =
class ProcessListView extends View

  constructor: (@main) ->
    super(@main);
    @processViews = [];

  @content: ->
    @div {class:"process-palette-process-list"}, =>
      @div {class:"process-palette-scrollable", outlet:"processList"}

  addProcess: (processController) =>
    processView = new ProcessView(@main, processController);
    @processViews.push(processView);

    @processList.append $$ ->
      @div =>
        @subview processController.config.id, processView

  removeProcess: (processController) =>
    processView = @getProcessView(processController);

    if processView
      index = @processViews.indexOf(processView);
      @processViews.splice(index, 1);
      processView.destroy();

  getProcessView: (processController) =>
    for processView in @processViews
      if processView.processController == processController
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
