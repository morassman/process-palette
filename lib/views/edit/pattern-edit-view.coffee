{View} = require 'atom-space-pen-views'
TableEditView = require './table-edit-view'

module.exports =
class PatternEditView extends View

  constructor: (@config) ->
    super();

  @content: ->
    @div =>
      @div {class: 'pattern-edit-view'}, =>
        @div {class: 'header'}, =>
          @h1 'Edit Patterns'
        @span 'Patterns are used to detect file paths and line number in the output when shown in the '
        @span 'panel', {class: 'text-highlight'}
        @span ' target. Each command can have its own patterns configured.'
        @tag 'p'
        @span ' The '
        @span 'Expression', {class: 'text-highlight'}
        @span ' column can contain any regular expression. The groups '
        @span '(path)', {class: 'text-highlight'}
        @span ' and '
        @span '(line)', {class: 'text-highlight'}
        @span ' are used to match file paths and line numbers respectively.'
        @span ' The '
        @span 'Path RegEx', {class: 'text-highlight'}
        @span ' column is optional. If it is left out then the built-in expression will be used for the path, '
        @span 'but a custom expression can be specified in case the built-in one isn\'t sufficient.'
        @tag 'p'
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
