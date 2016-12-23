{View} = require 'atom-space-pen-views'
ProcessConfig = require '../../process-config'
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
    sanitized = [];

    for command in @commands
      command = new ProcessConfig(command);
      sanitized.push(command);
      @addCommandItemView(command);

    @commands.splice(0, @commands.length);

    for command in sanitized
      @commands.push(command);

  setMainEditView: (@mainEditView) ->

  addNewCommand: ->
    command = new ProcessConfig({});
    command.stream = true;
    command.outputTarget = 'panel';
    @commands.push(command);
    itemView = @addCommandItemView(command);
    @commandItemViewSelected(itemView);

  addCommandItemView: (command) ->
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

  deleteCommandItemView: (itemView) ->
    @list[0].removeChild(itemView);
    @itemViews.splice(@itemViews.indexOf(itemView), 1);
    @commands.splice(@commands.indexOf(itemView.getCommand()), 1);

    if @selectedItemView == itemView
      @commandItemViewSelected(null);

  selectCommandItemViewWithAction: (action) ->
    for itemView in @itemViews
      if itemView.isForAction(action)
        itemView.selected();
        return;
