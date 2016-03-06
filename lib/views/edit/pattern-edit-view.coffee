{View} = require 'atom-space-pen-views'
TableEditView = require './table-edit-view'

module.exports =
class PatternEditView extends View

  constructor: (@config) ->
    super();

  @content: ->
    @div =>
      @div {class: 'process-palette-pattern-choose-view'}, =>
        @subview 'tableView', new TableEditView(['Name', 'Expression', 'Path RegEx'])

  initialize: ->
    patterns = @config.patterns;

    if !patterns?
      return;

    for name, value of patterns
      @tableView.addRow([name, value.expression, value.path]);

  persistChanges: ->
    patterns = {};
    rows = @tableView.getRows();

    for row in rows
      name = row[0].trim();

      if name.length > 0
        pattern = {};
        pattern.expression = row[1].trim();

        path = row[2].trim();
        if path.length > 0
          pattern.path = path;

        patterns[name] = pattern;

    @config.patterns = patterns;
