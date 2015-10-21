{CompositeDisposable} = require 'atom'
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
      @button {class: "btn icon-primitive-square", outlet: "killButton", click: "killButtonPressed"}
      @button "#{processController.getProcessID()}", {class: "btn", outlet: "showOutputButton", click: "showOutputButtonPressed"}

  initialize: ->
    @disposables = new CompositeDisposable();

    # Prevent the button from getting focus.
    @killButton.on 'mousedown', (e) ->
      e.preventDefault();

    @showOutputButton.on 'mousedown', (e) ->
      e.preventDefault();

    @disposables.add(atom.tooltips.add(@killButton, {title: "Stop/Discard"}));
    @disposables.add(atom.tooltips.add(@showOutputButton, {title: "Show output"}));

  destroy: ->
    @disposables.dispose();
    @processController.removeProcessCallback(@);
    @element.remove();

  getElement: ->
    return @element;

  processStarted: =>

  processStopped: =>
    @showTrashIcon();

  showTrashIcon: ->
    @killButton.removeClass('icon-primitive-square');
    @killButton.addClass('icon-x');

  killButtonPressed: ->
    if @processController.process != null
      @processController.killProcess();
    else
      @configController.removeProcessController(@processController);

  showOutputButtonPressed: ->
    if @isHighlighted()
      return;

    outputTarget = @configController.config.outputTarget;

    if (outputTarget == "panel")
      @main.showProcessOutput(@processController);
    else if (outputTarget == "console")
      atom.openDevTools();
    else if (outputTarget == "file")
      @processController.showNewFile();

  highlight: ->
    @showOutputButton.addClass("btn-primary selected");

  isHighlighted: ->
    return @showOutputButton.hasClass("selected");
