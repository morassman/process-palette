/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view');
const ProcessConfig = require('../../process-config');
const CommandItemView = require('./command-item-view');


export default class CommandChooseView extends View {

  constructor({ commands }) {
    super(false)
    this.commands = commands;
    this.selectedItemView = null;
    this.itemViews = []
    this.initialize()
  }

  render() {
    return <div>
      <div className="command-choose-view">
        <ul ref="list" className="list-group" />
      </div>
      <div className="add-command-button-view">
        <button ref="addButton" className="btn btn-sm" on={{ click: this.addNewCommand, mousedown: e => e.preventDefault() }}>Add</button>
      </div>
    </div>
  }

  static content() {
    return this.div(() => {
      this.div({class: 'command-choose-view'}, () => {
        return this.ul({class: 'list-group', outlet: 'list'});
    });
      return this.div({class: 'add-command-button-view'}, () => {
        return this.button('Add', {class: 'btn btn-sm', outlet: 'addButton', click: 'addNewCommand'});
    });
  });
  }

  initialize() {
    super.initialize()

    this.commands = this.commands.map(command => new ProcessConfig(command))
    this.commands.forEach(command => {
      this.addCommandItemView(command)
    })
  }

  setMainEditView(mainEditView) {
    this.mainEditView = mainEditView;
  }

  addNewCommand() {
    const command = new ProcessConfig({});
    command.stream = true;
    command.outputTarget = 'panel';
    this.commands.push(command);
    const itemView = this.addCommandItemView(command);
    this.commandItemViewSelected(itemView);
  }

  addCommandItemView(command) {
    const itemView = new CommandItemView();
    itemView.initialize(this, command);
    this.itemViews.push(itemView);
    this.refs.list.appendChild(itemView);
    return itemView;
  }

  commandItemViewSelected(itemView) {
    if (this.selectedItemView != null) {
      this.selectedItemView.setHighlighted(false);
    }
    this.mainEditView.commandItemViewSelected(itemView);
    this.selectedItemView = itemView;
    return (this.selectedItemView != null ? this.selectedItemView.setHighlighted(true) : undefined);
  }

  deleteCommandItemView(itemView) {
    this.refs.list.removeChild(itemView);
    this.itemViews.splice(this.itemViews.indexOf(itemView), 1);
    this.commands.splice(this.commands.indexOf(itemView.getCommand()), 1);

    if (this.selectedItemView === itemView) {
      return this.commandItemViewSelected(null);
    }
  }

  selectCommandItemViewWithAction(action) {
    for (let itemView of this.itemViews) {
      if (itemView.isForAction(action)) {
        itemView.selected();
        return;
      }
    }
  }

}
