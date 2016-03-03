{View} = require 'atom-space-pen-views'
TableRowView = require './table-row-view'

module.exports =
class TableEditView extends View

  constructor: (@columns) ->
    super(@columns);
    @rowViews = [];

  @content: (columns) ->
    colWidth = 100 / columns.length;

    @div {class: 'process-palette-table-edit-view'}, =>
      @div {class: 'table-view'}, =>
        @table =>
          @colgroup =>
            @col {style:"width:0%"}
            for column in columns
              @col {style:"width:#{colWidth}%"}
          @thead =>
            @tr =>
              @th ' '
              for column in columns
                @th column, {class: 'text-highlight'}
          @tbody {outlet: 'tableBody'}
      @div {class: 'button-view'}, =>
        @button 'Add', {class: "btn btn-sm", outlet: 'addButton', click: 'addEmptyRow'}

  initialize: ->
    @addButton.on 'mousedown', (e) -> e.preventDefault();

  addRow: (row) ->
    rowView = @addEmptyRow();
    rowView.setValues(row);

  addEmptyRow: ->
    rowView = new TableRowView();
    rowView.initialize(@, @getColumnCount());
    @tableBody[0].appendChild(rowView);
    @rowViews.push(rowView);
    return rowView;

  removeRowView: (rowView) ->
    @rowViews.splice(@rowViews.indexOf(rowView), 1);
    @tableBody[0].removeChild(rowView);

  getColumnCount: ->
    return @columns.length;
