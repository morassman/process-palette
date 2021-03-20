/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let TableEditView;
const {View} = require('atom-space-pen-views');
const TableRowView = require('./table-row-view');

module.exports =
(TableEditView = class TableEditView extends View {

  constructor(columns) {
    this.columns = columns;
    super(this.columns);
    this.rowViews = [];
  }

  static content(columns) {
    const colWidth = 100 / columns.length;

    return this.div({class: 'table-edit-view'}, () => {
      this.div({class: 'table-view'}, () => {
        return this.table(() => {
          this.colgroup(() => {
            this.col({style:"width:0%"});
            return Array.from(columns).map((column) =>
              this.col({style:`width:${colWidth}%`}));
        });
          this.thead(() => {
            return this.tr(() => {
              this.th(' ');
              return Array.from(columns).map((column) =>
                this.th(column, {class: 'text-highlight'}));
          });
        });
          return this.tbody({outlet: 'tableBody'});
      });
    });
      return this.div({class: 'button-view'}, () => {
        return this.button('Add', {class: "btn btn-sm", outlet: 'addButton', click: 'addEmptyRow'});
    });
  });
  }

  initialize() {
    return this.addButton.on('mousedown', e => e.preventDefault());
  }

  reset() {
    return (() => {
      const result = [];
      while (this.rowViews.length > 0) {
        result.push(this.removeRowView(this.rowViews[0]));
      }
      return result;
    })();
  }

  addRow(row) {
    const rowView = this.addEmptyRow();
    return rowView.setValues(row);
  }

  addEmptyRow() {
    const rowView = new TableRowView();
    rowView.initialize(this, this.getColumnCount());
    this.tableBody[0].appendChild(rowView);
    this.rowViews.push(rowView);
    return rowView;
  }

  removeRowView(rowView) {
    this.rowViews.splice(this.rowViews.indexOf(rowView), 1);
    return this.tableBody[0].removeChild(rowView);
  }

  getRows() {
    const rows = [];

    for (let rowView of Array.from(this.rowViews)) {
      rows.push(rowView.getValues());
    }

    return rows;
  }

  getColumnCount() {
    return this.columns.length;
  }
});
