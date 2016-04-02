{File} = require 'atom'
{View} = require 'atom-space-pen-views'
CommandChooseView = require './command-choose-view'
CommandEditView = require './command-edit-view'
PatternEditView = require './pattern-edit-view'

module.exports =
class MainEditView extends View

  constructor: (@main, @title, @filePath, @config) ->
    super(@title, @filePath, @config);

  @content: (title, filePath, config) ->
    @div =>
      @div {class: 'process-palette-main-edit-view'}, =>
        @div {class: 'left-view'}, =>
          @div title, {class: 'panel-heading text-highlight'}
          @div {class: 'panel-body'}, =>
            @subview 'commandChooseView', new CommandChooseView(config.commands)
          @button 'Edit Patterns', {class: 'btn btn-sm edit-patterns-button', outlet: 'editPatternsButton', click: 'editPatterns'}
        @div {class: 'right-view', outlet: 'rightView'}, =>
          @ul {class: 'background-message centered', outlet: 'emptyView'}, =>
            @li 'Choose to edit commands or patterns on the left'

  getTitle: ->
    return 'process-palette.json';

  initialize: ->
    @currentRightView = null;
    @commandChooseView.setMainEditView(@);
    @editPatternsButton.on 'mousedown', (e) -> e.preventDefault();

  editPatterns: ->
    if @currentRightView instanceof PatternEditView
      return;

    @persistCurrentView();
    @commandChooseView.commandItemViewSelected(null);

    view = new PatternEditView(@config);
    @setRightView(view);

  commandItemViewSelected: (itemView) ->
    @persistCurrentView();

    if itemView == null
      @setRightView(@emptyView);
    else
      view = new CommandEditView(@config, itemView);
      @setRightView(view);

  setRightView: (view) ->
    @currentRightView = view;
    @rightView.empty();
    @rightView.append(@currentRightView);

  persistCurrentView: ->
    if @currentRightView?.persistChanges?
      @currentRightView.persistChanges();

  saveChanges: ->
    @persistCurrentView();
    file = new File(@filePath);
    file.writeSync(JSON.stringify(@config, null, '  '));

  destroy: ->
    @saveChanges();
    @main.reloadConfiguration();
