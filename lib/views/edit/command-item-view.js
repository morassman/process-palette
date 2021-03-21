/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')

export default class CommandItemView extends View {

  constructor(commandChooseView, command) {
    super(false)
    this.commandChooseView = commandChooseView
    this.command = command
    this.initialize()
  }

  render() {
    return <li className="item-view">
      <button className="btn btn-sm icon icon-x" on={{ click: this.delete, mousedown: e => e.preventDefault() }}></button>
      <span ref="nameSpan" className="name-label" on={{ click: this.selected }}>{`${this.command.namespace}: ${this.command.action}`}</span>
    </li>
  }

  refreshName() {
    this.refs.nameSpan.textContent = `${this.command.namespace}: ${this.command.action}`
  }

  getCommand() {
    return this.command;
  }

  // return true if this command has the given action.
  isForAction(action) {
    return this.command.action === action;
  }

  selected() {
    this.commandChooseView.commandItemViewSelected(this);
  }

  setHighlighted(highlight) {
    if (highlight) {
      return this.refs.nameSpan.classList.add('highlighted');
    } else {
      return this.refs.nameSpan.classList.remove('highlighted');
    }
  }

  delete() {
    this.commandChooseView.deleteCommandItemView(this);
  }
}