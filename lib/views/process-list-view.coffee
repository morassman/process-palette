ProcessView = require './process-view'
ProcessOutputView = require './process-output-view'
{$$, View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

module.exports =
class ProcessListView extends View

  constructor: (@main) ->
    super(@main);
    @processViews = [];
    @disposables = new CompositeDisposable();

    @disposables.add atom.config.onDidChange 'process-palette.palettePanel.showCommand', ({newValue, oldValue}) => @setCommandVisible(newValue)
    @disposables.add atom.config.onDidChange 'process-palette.palettePanel.showOutputTarget', ({newValue, oldValue}) => @setOutputTargetVisible(newValue)

  @content: ->
    @div {class:"process-palette-process-list"}, =>
      @div {class:"process-palette-scrollable", outlet:"processList"}


  setCommandVisible: (visible) ->
    console.log('setCommandVisible : '+visible);
    for processView in @processViews
      processView.setCommandVisible(visible);

  setOutputTargetVisible: (visible) ->
    console.log('setOutputTargetVisible : '+visible);
    for processView in @processViews
      processView.setOutputTargetVisible(visible);

  addConfigController: (configController) =>
    processView = new ProcessView(@main, configController);
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
    @main.showProcessOutput(processController);

  serialize: ->

  destroy: ->
    @disposables.dispose();
    @element.remove();

  getElement: ->
    @element

  parentHeightChanged: (parentHeight) ->
    @processList.height(parentHeight);
