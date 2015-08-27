HelpView = require './help-view'
ProcessListView = require './process-list-view'
ProcessOutputView = require './process-output-view'
{$, View} = require 'atom-space-pen-views'

module.exports =
class MainView extends View

  constructor: (@main) ->
    super(@main);
    @viewHeight = 200;
    @showHelpView();

  @content: (main) ->
    @div {class: "process-palette process-palette-resizer"}, =>
      @div class: 'process-palette-resize-handle'
      @div {class: "button-group"}, =>
        @button {class:'btn btn-xs icon-question inline-block-tight', outlet: "helpButton", click:'toggleHelpView'}
        @button {class:'btn btn-xs icon-chevron-down inline-block-tight', click:'closePressed'}
      @div {class: "main-content", outlet: "mainContent"}, =>
        @subview "helpView", new HelpView(main)
        @subview "listView", new ProcessListView(main)
        @subview "outputView", new ProcessOutputView(main)

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
    @mainContent.height(@viewHeight);
    @viewHeight = @mainContent.height();
    @listView.parentHeightChanged(@viewHeight);
    @outputView.parentHeightChanged(@viewHeight);

  showListView: =>
    if @listView.isHidden()
      @hideHelpView();
      @outputView.hide();
      @listView.show();

  showOutputView: =>
    if @outputView.isHidden()
      @hideHelpView();
      @listView.hide();
      @outputView.show();

  toggleHelpView: =>
    if @helpView.isHidden()
      @showHelpView();
    else
      @showListView();

  hideHelpView: =>
    @helpView.hide();
    @helpButton.removeClass("btn-info");

  showHelpView: =>
    @listView.hide();
    @outputView.hide();
    @helpView.show();

    if !@helpButton.hasClass("btn-info")
      @helpButton.addClass("btn-info");

  showProcessOutput: (processController) =>
    @outputView.showProcessOutput(processController);
    @showOutputView();

  isOutputViewVisible: =>
    return @outputView.isVisible();

  closePressed: =>
    @main.hidePanel();

  addProcess: (processController) =>
    @listView.addProcess(processController);
    @showListView();

  removeProcess: (processController) =>
    @listView.removeProcess(processController);

  serialize: ->

  destroy: ->
    @listView.destroy();
    @outputView.destroy();
    @helpView.destroy();
    @element.remove();

  getElement: ->
    @element
