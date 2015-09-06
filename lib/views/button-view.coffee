{View} = require 'atom-space-pen-views'

module.exports =
class ButtonView extends View

  constructor: (@main, @configController, @processController) ->
    super(@main, @configController, @processController);
    @processController.addProcessCallback(@);

    if @processController.process == null
      @showTrashIcon();

  @content: (main, configController, processController) ->
    @span {class: "process-palette-button-view btn-group btn-group-sm inline-block-tight"}, =>
      @button {class: "btn icon-x", outlet: "killButton", click: "killButtonPressed"}
      @button "#{processController.getProcessID()}", {class: "btn", outlet: "showOutputButton", click: "showOutputButtonPressed"}

  initialize: ->
    # Prevent the button from getting focus.
    @killButton.on 'mousedown', (e) ->
      e.preventDefault();

    @showOutputButton.on 'mousedown', (e) ->
      e.preventDefault();

  destroy: ->
    @processController.removeProcessCallback(@);
    @element.remove();

  getElement: ->
    return @element;

  processStarted: =>

  processStopped: =>
    @showTrashIcon();

  showTrashIcon: ->
    @killButton.removeClass('icon-x');
    @killButton.addClass('icon-zap');

  killButtonPressed: ->
    if @processController.process != null
      @processController.killProcess();
    else
      @configController.removeProcessController(@processController);

  showOutputButtonPressed: ->
    if !@showOutputButton.hasClass("selected")
      @main.showProcessOutput(@processController);

  highlight: ->
    @showOutputButton.addClass("btn-primary selected");
