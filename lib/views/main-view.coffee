HelpView = require './help-view'
ProcessListView = require './process-list-view'
{$, View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

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
        @button {class:"btn btn-xs icon-pencil inline-block-tight", outlet: "editButton", click: "editPressed"}
        @button {class:"btn btn-xs icon-sync inline-block-tight", outlet: "reloadButton", click: "reloadPressed"}
        @button {class:"btn btn-xs icon-question inline-block-tight", outlet: "helpButton", click: "toggleHelpView"}
        @button {class:"btn btn-xs icon-chevron-down inline-block-tight", outlet: "hideButton", click: "closePressed"}
      @div {class: "main-content", outlet: "mainContent"}, =>
        @subview "helpView", new HelpView(main)
        @subview "listView", new ProcessListView(main)
        @div {outlet: "outputViewContainer"}

  initialize: ->
    @disposables = new CompositeDisposable();
    @disposables.add(atom.tooltips.add(@helpButton, {title: "Toggle help"}));
    @disposables.add(atom.tooltips.add(@editButton, {title: "Edit configuration"}));
    @disposables.add(atom.tooltips.add(@reloadButton, {title: "Reload configurations"}));
    @disposables.add(atom.tooltips.add(@hideButton, {title: "Hide"}));

    @editButton.on 'mousedown', (e) -> e.preventDefault();
    @reloadButton.on 'mousedown', (e) -> e.preventDefault();
    @helpButton.on 'mousedown', (e) -> e.preventDefault();
    @hideButton.on 'mousedown', (e) -> e.preventDefault();

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
      @outputView.detach();

    @outputView = processController.outputView;
    @outputViewContainer.append(@outputView);
    @showOutputView();

  isProcessOutputShown: (processController) ->
    if !@isOutputViewVisible()
      return false;

    if @outputView == null
      return false;

    return @outputView == processController.outputView;

  isOutputViewVisible: =>
    return @outputViewContainer.isVisible();

  editPressed: =>
    @main.editConfiguration();

  reloadPressed: =>
    @main.reloadConfiguration();

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

    @outputView.detach();
    @outputView = null;

    processController = processController.configController.getFirstProcessController();

    if @outputViewContainer.isVisible() and (processController != null)
      @showProcessOutput(processController);
    else
      @showListView();

  destroy: ->
    @listView.destroy();
    @helpView.destroy();
    @disposables.dispose();
    @element.remove();

  getElement: ->
    return @element;
