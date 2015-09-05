HelpView = require './help-view'
ProcessListView = require './process-list-view'
ProcessOutputView = require './process-output-view'
{$, View} = require 'atom-space-pen-views'

module.exports =
class MainView extends View

  constructor: (@main) ->
    super(@main);
    @viewHeight = 200;
    @outputView = null;
    @showHelpView();

  @content: (main) ->
    @div {class: "process-palette process-palette-resizer"}, =>
      @div class: "process-palette-resize-handle"
      @div {class: "button-group"}, =>
        @button {class:"btn btn-xs icon-question inline-block-tight", outlet: "helpButton", click: "toggleHelpView"}
        @button {class:"btn btn-xs icon-chevron-down inline-block-tight", click: "closePressed"}
      @div {class: "main-content", outlet: "mainContent"}, =>
        @subview "helpView", new HelpView(main)
        @subview "listView", new ProcessListView(main)
        @div {outlet: "outputViewContainer"}

  initialize: ->
    @on 'mousedown', '.process-palette-resize-handle', (e) => @resizeStarted(e);

  resizeStarted: =>
    $(document).on('mousemove', @resizeView)
    $(document).on('mouseup', @resizeStopped)

  resizeStopped: =>
    $(document).off('mousemove', @resizeView)
    $(document).off('mouseup', @resizeStopped)

  resizeView: ({pageY, which}) =>
    return @resizeStopped() unless which is 1

    change = @offset().top - pageY;
    @setViewHeight(@mainContent.height() + change);

  setViewHeight: (@viewHeight) ->
    @viewHeight = Math.max(@viewHeight, 100);
    @mainContent.height(@viewHeight);
    @viewHeight = @mainContent.height();
    @listView.parentHeightChanged(@viewHeight);
    @outputView?.parentHeightChanged(@viewHeight);

  showListView: =>
    if @listView.isHidden()
      @hideHelpView();
      @outputViewContainer.hide();
      @listView.show();

  showOutputView: =>
    if @outputViewContainer.isHidden()
      @hideHelpView();
      @listView.hide();
      @outputViewContainer.show();

  toggleHelpView: =>
    if @helpView.isHidden()
      @showHelpView();
    else
      @showListView();

  hideHelpView: =>
    @helpView.hide();
    @helpButton.removeClass("btn-info");

  showHelpView: ->
    @listView.hide();
    @outputViewContainer.hide();
    @helpView.show();

    if !@helpButton.hasClass("btn-info")
      @helpButton.addClass("btn-info");

  showProcessOutput: (processController) =>
    if @outputView != null
      @outputView.destroy();

    @outputView = new ProcessOutputView(@main, processController);
    @outputViewContainer.append(@outputView);
    @showOutputView();

  isOutputViewVisible: =>
    return @outputViewContainer.isVisible();

  closePressed: =>
    @main.hidePanel();

  addConfigController: (configController) =>
    @listView.addConfigController(configController);
    @showListView();

  removeConfigController: (configController) =>
    @listView.removeConfigController(configController);

  processControllerRemoved: (processController) ->
    if @outputView == null
      return;

    if @outputView.processController != processController
      return;

    processController = processController.configController.getFirstProcessController();

    if processController != null
      @showProcessOutput(processController);
    else
      @showListView();
      @outputView.destroy();
      @outputView = null;

  destroy: ->
    @listView.destroy();
    @outputView?.destroy();
    @helpView.destroy();
    @element.remove();

  getElement: ->
    return @element;
