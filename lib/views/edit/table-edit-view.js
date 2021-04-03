/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')

class TableRowView extends View {

  constructor(tableView, columnCount) {
    super(false)
    this.tableView = tableView
    this.columnCount = columnCount
    this.editors = []
    this.initialize()
  }

  render() {
    const cells = []

    for (let i = 0; i < this.columnCount; i++) {
      const cell = <td>
        <input ref={`editor${i}`} className='process-palette-input input-text native-key-bindings' type='text' />
      </td>
      cells.push(cell)
    }

    return <tr>
      <td>
        <button ref={`removeBtn`} attributes={{ tabindex: -1 }} className="btn btn-sm icon-x" on={{ click: () => this.delete(), mousedown: e => e.preventDefault() }} />
      </td>
      {cells}
    </tr>
  }

  delete() {
    this.tableView.removeRowView(this)
  }

  setRowIndex(index) {
    let tabIndex = index * (this.columnCount) + 1

    for (let i = 0; i < this.columnCount; i++) {
      this.refs[`editor${i}`].setAttribute('tabindex', tabIndex + i)
    }
  }

  setValues(values) {
    for (var i = 0; i < values.length; i++) {
      value = values[i]

      if (!value) {
        value = ""
      }

      this.refs[`editor${i}`].value = value
    }
  }

  getValues() {
    const values = []

    for (var i = 0; i < this.columnCount; i++) {
      values.push(this.refs[`editor${i}`].value)
    }

    return values
  }

}

export default class TableEditView extends View {

  constructor({ columns }) {
    super(false)
    this.columns = columns;
    this.rowViews = [];
    this.initialize()
  }

  render() {
    const colWidth = 100 / this.columns.length

    return <div className="process-palette-table-edit-view">
      <table>
        <colgroup>
          <col attributes={{ style: "width: 0%" }}></col>
          {this.columns.map(column => <col attributes={{ style: `width:${colWidth}%` }} />)}
        </colgroup>
        <thead>
          <th></th>
          {this.columns.map(column => <th className="text-highlight">{column}</th>)}
        </thead>
        <tbody ref="tableBody"></tbody>
      </table>
      <div className="process-palette-table-edit-view-buttons">
        <button ref="addButton" className="btn btn-sm" on={{ click: () => this.addEmptyRow() }}>Add</button>
      </div>
    </div>
  }

  reset() {
    while (this.rowViews.length > 0) {
      this.removeRowView(this.rowViews[0]);
    }
  }

  addRow(row) {
    const rowView = this.addEmptyRow();
    rowView.setValues(row)
    return rowView
  }

  addEmptyRow() {
    const rowView = new TableRowView(this, this.getColumnCount())
    this.refs.tableBody.appendChild(rowView.element);
    this.rowViews.push(rowView);
    this.refreshTabIndexes()
    return rowView;
  }

  removeRowView(rowView) {
    this.rowViews.splice(this.rowViews.indexOf(rowView), 1);
    this.refs.tableBody.removeChild(rowView.element);
    this.refreshTabIndexes()
  }

  refreshTabIndexes() {
    for (let i = 0; i < this.rowViews.length; i++) {
      this.rowViews[i].setRowIndex(i)
    }
  }

  getRows() {
    const rows = [];

    for (let rowView of this.rowViews) {
      rows.push(rowView.getValues());
    }

    return rows;
  }

  getColumnCount() {
    return this.columns.length;
  }

}
