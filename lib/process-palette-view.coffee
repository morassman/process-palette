ProcessView = require './process-view'
{CompositeDisposable} = require 'atom'
{$$, ScrollView} = require 'atom-space-pen-views'

module.exports =
class ProcessPaletteView extends ScrollView
  @content: ->
    @div class:"process-palette", =>
      @div {class:"process-list", outlet:"processList"}

  addProcess: (processController) ->
    @processList.append $$ ->
      @div =>
        @subview processController.config.id, new ProcessView(processController)

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @subscriptions?.dispose();
    @element.remove();

  getElement: ->
    @element

  getTitle: ->
    return 'Process Palette'
