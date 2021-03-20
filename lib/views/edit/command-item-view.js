/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let CommandItemView;
const {$, $$} = require('atom-space-pen-views');

module.exports =
(CommandItemView = class CommandItemView extends HTMLElement {

  initialize(commandChooseView, command) {
    this.commandChooseView = commandChooseView;
    this.command = command;
    this.classList.add('item-view');

    const button = $$(function() {
      return this.button({class: 'btn btn-sm icon icon-x'});});
    this.nameSpan = $$(function() {
      return this.span('Name', {class: 'name-label'});});

    button.click(() => this.delete());
    button.on('mousedown', e => e.preventDefault());

    this.nameSpan.text(this.command.namespace+": "+this.command.action);
    this.nameSpan.click(() => this.selected());

    const element = $(this);

    button.appendTo(element);
    return this.nameSpan.appendTo(element);
  }

  refreshName() {
    return this.nameSpan.text(this.command.namespace+": "+this.command.action);
  }

  getCommand() {
    return this.command;
  }

  // return true if this command has the given action.
  isForAction(action) {
    return this.command.action === action;
  }

  selected() {
    return this.commandChooseView.commandItemViewSelected(this);
  }

  setHighlighted(highlight) {
    if (highlight) {
      return this.nameSpan.addClass('highlighted');
    } else {
      return this.nameSpan.removeClass('highlighted');
    }
  }

  delete() {
    return this.commandChooseView.deleteCommandItemView(this);
  }
});

module.exports = document.registerElement("command-item-view", {prototype: CommandItemView.prototype, extends: "li"});
