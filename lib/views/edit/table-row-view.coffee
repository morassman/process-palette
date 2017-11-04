{$, $$, TextEditorView} = require 'atom-space-pen-views'

module.exports =
class TableRowView extends HTMLElement

  initialize: (@tableView, @columnCount) ->
    @editors = [];

    deleteElement = document.createElement("td");
    jdelete = $(deleteElement);
    deleteButton = $$ ->
      @button {class: "btn btn-sm icon-x"}

    deleteButton.click => @delete();
    deleteButton.on 'mousedown', (e) -> e.preventDefault();
    jdelete.append(deleteButton);
    @appendChild(deleteElement);

    for column in [0...@columnCount]
      td = document.createElement("td");
      editor = new TextEditorView(mini: true);
      jtd = $(td);
      jtd.append(editor);
      @appendChild(td);
      @editors.push(editor);

  delete: ->
    @tableView.removeRowView(@);

  setValues: (values) ->
    for i in [0 ... values.length]
      value = values[i];

      if !value?
        value = '';

      @editors[i].getModel().setText(value);

  getValues: ->
    values = [];

    for editor in @editors
      values.push(editor.getModel().getText());

    return values;

module.exports = document.registerElement("table-row-view", prototype: TableRowView.prototype, extends: "tr")
