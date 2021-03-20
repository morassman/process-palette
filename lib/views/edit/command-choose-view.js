/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CommandChooseView;
const {View} = require('atom-space-pen-views');
const ProcessConfig = require('../../process-config');
const CommandItemView = require('./command-item-view');

module.exports =
(CommandChooseView = class CommandChooseView extends View {

  constructor(commands) {
    this.commands = commands;
    super();
    this.selectedItemView = null;
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
    let command;
    this.addButton.on('mousedown', e => e.preventDefault());
    this.itemViews = [];
    const sanitized = [];

    for (command of Array.from(this.commands)) {
      command = new ProcessConfig(command);
      sanitized.push(command);
      this.addCommandItemView(command);
    }

    this.commands.splice(0, this.commands.length);

    return (() => {
      const result = [];
      for (command of Array.from(sanitized)) {
        result.push(this.commands.push(command));
      }
      return result;
    })();
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
    return this.commandItemViewSelected(itemView);
  }

  addCommandItemView(command) {
    const itemView = new CommandItemView();
    itemView.initialize(this, command);
    this.itemViews.push(itemView);
    this.list[0].appendChild(itemView);
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
    this.list[0].removeChild(itemView);
    this.itemViews.splice(this.itemViews.indexOf(itemView), 1);
    this.commands.splice(this.commands.indexOf(itemView.getCommand()), 1);

    if (this.selectedItemView === itemView) {
      return this.commandItemViewSelected(null);
    }
  }

  selectCommandItemViewWithAction(action) {
    for (let itemView of Array.from(this.itemViews)) {
      if (itemView.isForAction(action)) {
        itemView.selected();
        return;
      }
    }
  }
});
