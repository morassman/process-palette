/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let TableRowView;
const {$, $$, TextEditorView} = require('atom-space-pen-views');

module.exports =
(TableRowView = class TableRowView extends HTMLElement {

  initialize(tableView, columnCount) {
    this.tableView = tableView;
    this.columnCount = columnCount;
    this.editors = [];

    const deleteElement = document.createElement("td");
    const jdelete = $(deleteElement);
    const deleteButton = $$(function() {
      return this.button({class: "btn btn-sm icon-x"});});

    deleteButton.click(() => this.delete());
    deleteButton.on('mousedown', e => e.preventDefault());
    jdelete.append(deleteButton);
    this.appendChild(deleteElement);

    return (() => {
      const result = [];
      for (let column = 0, end = this.columnCount, asc = 0 <= end; asc ? column < end : column > end; asc ? column++ : column--) {
        const td = document.createElement("td");
        const editor = new TextEditorView({mini: true});
        const jtd = $(td);
        jtd.append(editor);
        this.appendChild(td);
        result.push(this.editors.push(editor));
      }
      return result;
    })();
  }

  delete() {
    return this.tableView.removeRowView(this);
  }

  setValues(values) {
    return (() => {
      const result = [];
      for (let i = 0, end = values.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        let value = values[i];

        if ((value == null)) {
          value = '';
        }

        result.push(this.editors[i].getModel().setText(value));
      }
      return result;
    })();
  }

  getValues() {
    const values = [];

    for (let editor of Array.from(this.editors)) {
      values.push(editor.getModel().getText());
    }

    return values;
  }
});

module.exports = document.registerElement("table-row-view", {prototype: TableRowView.prototype, extends: "tr"});
