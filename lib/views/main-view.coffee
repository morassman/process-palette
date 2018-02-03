HelpView = require './help-view'
ProjectView = require './project-view'
{$, $$, View, TextEditorView} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

module.exports =
class MainView extends View

  @URI = 'atom://process-palette'

  constructor: (@main) ->
    super(@main);
    @viewHeight = 200;
    @outputView = null;
    @showHelpView();

  @content: (main) ->
    @div {class: "process-palette"}, =>
      @div {class: "button-group"}, =>
        @button "Save", {class:"btn btn-sm btn-fw btn-info inline-block-tight", outlet: "saveButton", click: "savePressed"}
        @button {class:"btn btn-sm btn-fw icon-pencil inline-block-tight", outlet: "editButton", click: "editPressed"}
        @button {class:"btn btn-sm btn-fw icon-sync inline-block-tight", outlet: "reloadButton", click: "reloadPressed"}
        @button {class:"btn btn-sm btn-fw icon-gear inline-block-tight", outlet: "settingsButton", click: "settingsPressed"}
        @button {class:"btn btn-sm btn-fw icon-question inline-block-tight", outlet: "helpButton", click: "toggleHelpView"}
        @button {class:"btn btn-sm btn-fw icon-chevron-down inline-block-tight", outlet: "hideButton", click: "closePressed"}
      @div {class: "main-content", outlet: "mainContent"}, =>
        @div {outlet: "helpView"}, =>
          @subview "hv", new HelpView(main)
        @div {class: "projects-list", outlet: "listView"}
        @div {class: "output-view", outlet: "outputViewContainer"}

  initialize: ->
    @disposables = new CompositeDisposable();
    @disposables.add(atom.tooltips.add(@saveButton, {title: "Save changes"}));
    @disposables.add(atom.tooltips.add(@helpButton, {title: "Toggle help"}));
    @disposables.add(atom.tooltips.add(@editButton, {title: "Edit configuration"}));
    @disposables.add(atom.tooltips.add(@reloadButton, {title: "Reload configurations"}));
    @disposables.add(atom.tooltips.add(@settingsButton, {title: "Settings"}));
    @disposables.add(atom.tooltips.add(@hideButton, {title: "Hide"}));

    @saveButton.on 'mousedown', (e) -> e.preventDefault();
    @editButton.on 'mousedown', (e) -> e.preventDefault();
    @reloadButton.on 'mousedown', (e) -> e.preventDefault();
    @settingsButton.on 'mousedown', (e) -> e.preventDefault();
    @helpButton.on 'mousedown', (e) -> e.preventDefault();
    @hideButton.on 'mousedown', (e) -> e.preventDefault();

    @saveButton.hide();

  getTitle: ->
    return 'Process Palette';

  getURI: ->
    return MainView.URI;

  getPreferredLocation: ->
    return 'bottom';

  getAllowedLocations: ->
    return ['bottom', 'left', 'right'];

  isPermanentDockItem: ->
    return false;

  setViewHeight: (@viewHeight) ->
    # @viewHeight = Math.max(@viewHeight, 100);
    # @mainContent.height(@viewHeight);
    # @viewHeight = @mainContent.height();
    # @listView.parentHeightChanged(@viewHeight);
    # @outputView?.parentHeightChanged(@viewHeight);

  setSaveButtonVisible: (visible) ->
    if visible
      @saveButton.show();
    else
      @saveButton.hide();

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

  savePressed: =>
    @main.savePanel();

  editPressed: =>
    @main.editConfiguration();

  reloadPressed: =>
    @main.reloadConfiguration();

  settingsPressed: =>
    atom.workspace.open('atom://config/packages/process-palette');

  closePressed: =>
    @main.hidePanel();

  addProjectView: (view) =>
    @listView.append(view);
    # @listDiv[0].appendChild(view.get(0));
    # viewElement = document.createElement("div");
    # @listDiv[0].appendChild(viewElement);
    # jview = $(viewElement);
    # jview.append(view);


    @showListView();

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

  killFocusedProcess: (discard) ->
    if !@outputViewContainer.isHidden()
      @outputView?.processController.killProcess(discard);

  discardFocusedOutput: ->
    if !@outputViewContainer.isHidden()
      @outputView?.processController.discard();

  deactivate: ->
    # @listView.destroy();
    @hv.destroy();
    @disposables.dispose();
    @element.remove();

  getElement: ->
    return @element;
