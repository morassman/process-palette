ButtonView = require './button-view'
{$, $$, View} = require 'atom-space-pen-views'

module.exports =
class ButtonsView extends View

  constructor: (@configController, @parentProcessController) ->
    super();
    @buttonViews = [];

    for processController in @configController.processControllers
      @addButton(processController);

  initialize: ->
    @configController.addListener(@);

  @content: ->
    @span =>
      @span {style: "display: flex; flex-direction: row", outlet: "buttonListView"}

  getElement: ->
    return @element;

  destroy: ->
    for buttonView in @buttonViews
      buttonView.destroy();

    @configController.removeListener(@);
    @element.remove();

  processStarted: (processController) ->
    @addButton(processController);

    if processController.config.outputTarget == "panel" and processController.config.autoShowOutput
      processController.showProcessOutput();

  addButton: (processController) ->
    buttonView = new ButtonView(@configController, processController);

    if processController == @parentProcessController
      buttonView.highlight();

    @buttonViews.push(buttonView);

    @buttonListView.append $$ ->
      @span =>
        @subview "pid#{processController.getProcessID()}", buttonView

  processStopped: (processController) ->

  processControllerRemoved: (processController) ->
    buttonView = @getButtonView(processController);

    if buttonView == null
      return;

    index = @buttonViews.indexOf(buttonView);

    if (index != -1)
      @buttonViews.splice(index, 1);

    buttonViewParent = buttonView.parent();
    $(buttonViewParent).fadeOut 200, =>
      buttonView.destroy();
      buttonViewParent.remove();

  getButtonView: (processController) ->
    for buttonView in @buttonViews
      if buttonView.processController == processController
        return buttonView;

    return null;
