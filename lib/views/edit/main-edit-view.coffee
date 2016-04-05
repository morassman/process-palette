{File} = require 'atom'
{$$, View} = require 'atom-space-pen-views'
SplitView = require '../split-view'
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
        @subview 'splitView', new SplitView();
        @div {class: 'left-view', outlet: 'leftView'}, =>
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

    @leftView.detach();
    @rightView.detach();

    @splitView.setLeftView(@leftView);
    @splitView.setRightView(@rightView);

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

  setRightView: (@currentRightView) ->
    @splitView.setRightView(@currentRightView);

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
