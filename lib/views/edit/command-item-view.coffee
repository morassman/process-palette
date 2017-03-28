{$, View} = require 'atom-space-pen-views'

module.exports =
class CommandItemView extends View

  constructor: (@commandChooseView, @command) ->
    super(@commandChooseView, @command);

  @content: (commandChooseView, command) ->
    @li {class: 'item-view'}, =>
      @button {outlet: "button", class: 'btn btn-sm icon icon-x'}
      @button 'Name', {outlet: "nameSpan", class: 'btn btn-sm name-label'}

  initialize: ->
    @button.click => @delete()
    @button.on 'mousedown', (e) -> e.preventDefault()
    @nameSpan.text(@command.namespace+": "+@command.action)
    @nameSpan.click => @selected()

  refreshName: ->
    @nameSpan.text(@command.namespace+": "+@command.action);

  getCommand: ->
    return @command;

  # return true if this command has the given action.
  isForAction: (action) ->
    return @command.action == action;

  selected: ->
    @commandChooseView.commandItemViewSelected(@);

  setHighlighted: (highlight) ->
    if highlight
      @nameSpan.addClass('highlighted');
    else
      @nameSpan.removeClass('highlighted');

  delete: ->
    @commandChooseView.deleteCommandItemView(@);
