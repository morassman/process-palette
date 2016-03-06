{View} = require 'atom-space-pen-views'
TableEditView = require './table-edit-view'

module.exports =
class PatternEditView extends View

  constructor: (@patterns) ->
    super();
    @itemViews = [];

  @content: ->
    @div =>
      @div {class: 'process-palette-pattern-choose-view'}, =>
        @subview 'tableView', new TableEditView(['Name', 'Expression', 'Path RegEx'])

  persistChanges: ->
    console.log("PatternEditView.persistChanges");
