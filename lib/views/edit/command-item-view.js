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
    return <div className="process-palette-command-item-view">
      <button className="btn btn-sm icon icon-x" on={{ click: () => this.delete(), mousedown: e => e.preventDefault() }}></button>
      <span ref="nameSpan" className="process-palette-command-item-view-label" on={{ click: () => this.selected() }}>{`${this.command.namespace}: ${this.command.action}`}</span>
    </div>
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
      return this.refs.nameSpan.classList.add('process-palette-command-item-view-highlighted');
    } else {
      return this.refs.nameSpan.classList.remove('process-palette-command-item-view-highlighted');
    }
  }

  delete() {
    this.commandChooseView.deleteCommandItemView(this);
  }
}