/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view');
const ProcessConfig = require('../../process-config');
const CommandItemView = require('./command-item-view');


export default class CommandChooseView extends View {

  constructor({ mainEditView, config }) {
    super(false)
    this.mainEditView = mainEditView
    this.config = config
    this.selectedItemView = null;
    this.itemViews = []
    this.initialize()
  }

  render() {
    return <div>
      <div className="process-palette-command-choose-view">
        <div ref="list" className="process-palette-command-choose-view-list" />
      </div>
      <div className="process-palette-command-choose-view-buttons">
        <button ref="addButton" className="btn btn-sm" on={{ click: () => this.addNewCommand(), mousedown: e => e.preventDefault() }}>Add Command</button>
      </div>
    </div>
  }

  initialize() {
    super.initialize()

    this.config.commands.forEach(command => {
      this.addCommandItemView(command)
    })
  }

  addNewCommand() {
    const command = new ProcessConfig({});
    command.stream = true;
    command.outputTarget = 'panel';
    this.config.commands.push(command);
    const itemView = this.addCommandItemView(command);
    this.commandItemViewSelected(itemView);
  }

  addCommandItemView(command) {
    const itemView = new CommandItemView(this, command);
    this.itemViews.push(itemView);
    this.refs.list.appendChild(itemView.element);
    return itemView;
  }

  commandItemViewSelected(itemView) {
    if (this.selectedItemView != null) {
      this.selectedItemView.setHighlighted(false);
    }

    this.mainEditView.commandItemViewSelected(itemView);
    this.selectedItemView = itemView;

    if (this.selectedItemView) {
      this.selectedItemView.setHighlighted(true)
    }
  }

  deleteCommandItemView(itemView) {
    this.refs.list.removeChild(itemView.element);
    this.itemViews.splice(this.itemViews.indexOf(itemView), 1);
    this.config.commands.splice(this.config.commands.indexOf(itemView.getCommand()), 1);

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
