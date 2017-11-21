{$, $$, View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

ProcessView = null;

module.exports =
class ProjectView extends View

  constructor: (@controller) ->
    super(@controller);
    @processViews = [];
    @folded = false;
    @disposables = new CompositeDisposable();

    @disposables.add atom.config.onDidChange 'process-palette.palettePanel.showCommand', ({newValue, oldValue}) => @setCommandVisible(newValue)
    @disposables.add atom.config.onDidChange 'process-palette.palettePanel.showOutputTarget', ({newValue, oldValue}) => @setOutputTargetVisible(newValue)

  @content: (controller) ->
    @div {class: "project-view"}, =>
      @div {class: "project-heading hand-cursor", click: "toggleFolded"}, =>
        @div {class: "name", outlet: "projectName"}
        @span {class: "icon icon-fold", outlet: "foldButton"}
      @div {class: "process-list", outlet: "processList"}

  initialize: ->
    @projectName.html(@controller.getDisplayName());
    @foldButton.on 'mousedown', (e) -> e.preventDefault();

  toggleFolded: ->
    if @folded
      @foldButton.addClass('icon-fold');
      @foldButton.removeClass('icon-unfold');
    else
      @foldButton.addClass('icon-unfold');
      @foldButton.removeClass('icon-fold');

    @folded = !@folded;

    if @folded
      @processList.hide();
    else
      @processList.show();

  setCommandVisible: (visible) ->
    for processView in @processViews
      processView.setCommandVisible(visible);

  setOutputTargetVisible: (visible) ->
    for processView in @processViews
      processView.setOutputTargetVisible(visible);

  addConfigController: (configController) =>
    ProcessView ?= require './process-view'
    processView = new ProcessView(configController);
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
    processController.showProcessOutput();

  serialize: ->

  destroy: ->
    @disposables.dispose();
    @processList.remove();

  getElement: ->
    @element

  parentHeightChanged: (parentHeight) ->
    # @processList.height(parentHeight);
