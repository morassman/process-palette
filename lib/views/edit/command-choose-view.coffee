{View} = require 'atom-space-pen-views'
CommandItemView = require './command-item-view'

module.exports =
class CommandChooseView extends View

  constructor: (@commands) ->
    super();
    @selectedItemView = null;

  @content: ->
    @div =>
      @div {class: 'command-choose-view'}, =>
        @ul {class: 'list-group', outlet: 'list'}
      @div {class: 'add-command-button-view'}, =>
        @button 'Add', {class: 'btn btn-sm', outlet: 'addButton', click: 'addNewCommand'}

  initialize: ->
    @addButton.on 'mousedown', (e) -> e.preventDefault();
    @itemViews = [];

    for command in @commands
      @addCommand(command);

  setMainEditView: (@mainEditView) ->

  addNewCommand: ->
    itemView = @addCommand({});
    @commandItemViewSelected(itemView);

  addCommand: (command) ->
    itemView = new CommandItemView();
    itemView.initialize(@, command);
    @itemViews.push(itemView);
    @list[0].appendChild(itemView);
    return itemView;

  commandItemViewSelected: (itemView) ->
    @selectedItemView?.setHighlighted(false);
    @mainEditView.commandItemViewSelected(itemView);
    @selectedItemView = itemView;
    @selectedItemView?.setHighlighted(true);
