{$, View, TextEditorView} = require 'atom-space-pen-views'

module.exports =
class TableRowView extends View

  constructor: (@tableView, @columnCount) ->
    @editors = [];
    super(@, @columnCount)

  @content: (self, columnCount) ->
    @tr {class: "table-row"}, =>
      if self.tableView.options.selectable
        @td {outlet: "selectElement"}, =>
          @input {outlet: "selectButton", type: 'checkbox', class: "select input-checkbox"}

      if self.tableView.options.deletable
        @td =>
          @button {outlet: "deleteButton", class: "btn btn-sm inline-block-tight icon icon-x delete"}

      for column in [0...columnCount]
        @td =>
          editor = new TextEditorView();
          editor.addClass('multi-line-editor');
          editor.getModel().setSoftTabs(true);
          editor.getModel().setSoftWrapped(true);
          editor.getModel().setLineNumberGutterVisible(false);
          self.editors.push(editor);
          @subview null, editor

  initialize: ->
    if @tableView.options.selectable
      @selectButton.click (e) => @clickSelect(e);
      @selectButton.on 'mousedown', (e) -> e.preventDefault();  # prevent getting focus???
    if @tableView.options.deletable
      @deleteButton.click => @delete();
      @deleteButton.on 'mousedown', (e) -> e.preventDefault();  # prevent getting focus???
    if @tableView.options.draggable
      @addClass 'drop-target'

  setChecked: (checkbox, checked) ->
    if checkbox?
      if !checked?
        checked = false
      if checked != checkbox.is(":checked")
        checkbox.trigger("click");

  clickSelect: (e) ->
    @select_($(@).find(":checked").length > 0)
    e.stopPropagation()

  select: (value) ->
    @setChecked @selectButton, value
    @select_(value)

  select_: (value) ->
    if value
      @selected = true
      $(@).addClass "selected"
      if @tableView.options.draggable
        $(@).attr("draggable", true)
    else
      @selected = false
      $(@).removeClass "selected"
      if @tableView.options.draggable
        $(@).attr("draggable", false)
    @tableView.updateView()

  delete: ->
    @tableView.removeRowView(@);

  setValues: (values) ->
    for i in [0 ... values.length]
      value = values[i]
      if !value?
        value = ''
      @editors[i].getModel().setText(value);

  getValues: ->
    values = [];
    for editor in @editors
      values.push(editor.getModel().getText());
    return values;
