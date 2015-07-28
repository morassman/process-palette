ProcessView = require './process-view'
ProcessOutputView = require './process-output-view'
{CompositeDisposable} = require 'atom'
{$$, View} = require 'atom-space-pen-views'

module.exports =
class ProcessListView extends View

  constructor: (@main) ->
    super(@main);

  @content: ->
    @div =>
      @div {class:"scrollable", outlet:"processList"}
      @div {outlet:"processOutput"}

  addProcess: (processController) =>
    processView = new ProcessView(@, processController);

    @processList.append $$ ->
      @div =>
        @subview processController.config.id, processView

  showProcessList: =>
    @processList.removeClass("hidden");

    if @processOutputView
      @processOutputView.destroy();
      @processOutputView = null;

    @processOutput.text("");

  showProcessOutput: (processController) =>
    # If output is already shown then first remove it.
    if @processOutputView
      @processOutputView.destroy();

    @processList.addClass("hidden");
    @processOutputView = new ProcessOutputView(@, processController);

    f = () =>
      return @processOutputView;

    @processOutput.append $$ ->
      @div =>
        @subview "processController.config.id", f()

    # Ensure that the panel is visible.
    @main.show();

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove();

  getElement: ->
    @element
