{$, $$} = require 'atom-space-pen-views'
ProcessConfig = require '../../process-config'

module.exports =
class CommandItemView extends HTMLElement

  initialize: (@commandChooseView, @command) ->
    @command = new ProcessConfig(@command);
    @.classList.add('item-view');

    button = $$ ->
      @button {class: 'btn btn-sm icon icon-x'}
    @nameSpan = $$ ->
      @span 'Name', {class: 'name-label'}

    button.click => @delete();
    button.on 'mousedown', (e) -> e.preventDefault();

    @nameSpan.text(@command.namespace+": "+@command.action);
    @nameSpan.click => @selected();

    element = $(@);

    button.appendTo(element);
    @nameSpan.appendTo(element);

  refreshName: ->
    @nameSpan.text(@command.namespace+": "+@command.action);

  getCommand: ->
    return @command;

  selected: ->
    @commandChooseView.commandItemViewSelected(@);

  setHighlighted: (highlight) ->
    if highlight
      @nameSpan.addClass('highlighted');
    else
      @nameSpan.removeClass('highlighted');

  delete: ->
    console.log('delete');

module.exports = document.registerElement("command-item-view", prototype: CommandItemView.prototype, extends: "li")
