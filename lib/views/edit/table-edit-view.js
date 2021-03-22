/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')
const { TextEditor } = require('atom')

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

    for (var i = 0; i < this.columnCount; i++) {
      const cell = <td>
        <TextEditor ref={`editor${i}`} mini={true} />
      </td>
      cells.push(cell)
    }

    return <tr>
      <td>
        <button className="btn btn-sm icon-x" on={{ click: this.delete, mousedown: e => e.preventDefault() }} />
      </td>
      {cells}
    </tr>
  }

  delete() {
    this.tableView.removeRowView(this)
  }

  setValues(values) {
    for (var i = 0; i < values.length; i++) {
      value = values[i]

      if (!value) {
        value = ""
      }

      this.refs[`editor${i}`].setText(value)
    }
  }

  getValues() {
    const values = []

    for (var i = 0; i < this.columnCount; i++) {
      values.push(this.refs[`editor${i}`].getText())
    }

    return values
  }


  // initialize: (@tableView, @columnCount) ->
  //   @editors = [];

  //   deleteElement = document.createElement("td");
  //   jdelete = $(deleteElement);
  //   deleteButton = $$ ->
  //     @button {class: "btn btn-sm icon-x"}

  //   deleteButton.click => @delete();
  //   deleteButton.on 'mousedown', (e) -> e.preventDefault();
  //   jdelete.append(deleteButton);
  //   @appendChild(deleteElement);

  //   for column in [0...@columnCount]
  //     td = document.createElement("td");
  //     editor = new TextEditorView(mini: true);
  //     jtd = $(td);
  //     jtd.append(editor);
  //     @appendChild(td);
  //     @editors.push(editor);

  // delete: ->
  //   @tableView.removeRowView(@);

  // setValues: (values) ->
  //   for i in [0 ... values.length]
  //     value = values[i];

  //     if !value?
  //       value = '';

  //     @editors[i].getModel().setText(value);

  // getValues: ->
  //   values = [];

  //   for editor in @editors
  //     values.push(editor.getModel().getText());

  //   return values;

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
      <div className="table-view">
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
      </div>
      <div className="button-view">
        <button ref="addButton" className="btn btn-sm" on={{ click: this.addEmptyRow }}>Add</button>
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
    return rowView;
  }

  removeRowView(rowView) {
    this.rowViews.splice(this.rowViews.indexOf(rowView), 1);
    this.refs.tableBody.removeChild(rowView.element);
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
