{File, CompositeDisposable} = require 'atom'
{$$, View} = require 'atom-space-pen-views'
SplitView = require '../split-view'
CommandChooseView = require './command-choose-view'
CommandEditView = require './command-edit-view'
PatternEditView = require './pattern-edit-view'

module.exports =
class MainEditView extends View

  constructor: (@main, @title, @filePath, @config, @selectedAction) ->
    super(@title, @filePath, @config, @selectedAction);

  @content: (title, filePath, config) ->
    @div =>
      @div {class: 'main-edit-view'}, =>
        @subview 'splitView', new SplitView();
        @div {class: 'left-view', outlet: 'leftView'}, =>
          @span title, {class: 'title text-highlight'}
          @button {class:"btn btn-sm icon-unfold inline-block-tight reload-button", outlet: "toggleButton", click: "togglePressed"}
          @button {class:"btn btn-sm icon-sync inline-block-tight reload-button", outlet: "reloadButton", click: "reloadPressed"}
          @div {class: 'panel-body'}, =>
            @subview 'commandChooseView', new CommandChooseView(config.commands)
          @button 'Edit Patterns', {class: 'btn btn-sm edit-patterns-button', outlet: 'editPatternsButton', click: 'editPatterns'}
        @div {class: 'right-view', outlet: 'rightView'}, =>
          @ul {class: 'background-message centered'}, =>
            @li 'Choose to edit commands or patterns on the left'

  getTitle: ->
    return 'process-palette.json';

  initialize: ->
    @disposables = new CompositeDisposable();
    @disposables.add(atom.tooltips.add(@toggleButton, {title: "Toggle panel"}));
    @disposables.add(atom.tooltips.add(@reloadButton, {title: "Apply and reload"}));
    @disposables.add atom.workspace.onWillDestroyPaneItem (e) => @willDestroy(e);

    @toggleButton.on 'mousedown', (e) -> e.preventDefault();
    @reloadButton.on 'mousedown', (e) -> e.preventDefault();

    @currentRightView = null;
    @commandChooseView.setMainEditView(@);

    @leftView.detach();
    @rightView.detach();

    @splitView.setLeftView(@leftView);
    @splitView.setRightView(@rightView);

    @editPatternsButton.on 'mousedown', (e) -> e.preventDefault();
    @saved = JSON.stringify(@config, null, '  ');

    if @selectedAction != null
      @commandChooseView.selectCommandItemViewWithAction(@selectedAction);

  willDestroy: (e) ->
    if e.item isnt @
      return;

    @persistCurrentView();
    memory = JSON.stringify(@config, null, '  ');

    if memory == @saved
      return;

    options = {};
    options.message = 'Configuration changed';
    options.detailedMessage = 'Save and apply new configuration?';
    options.buttons = ['Yes', 'No'];

    choice = atom.confirm(options);

    if choice == 0
      @saveToFile(memory);
      @main.reloadConfiguration(false);

  togglePressed: ->
    @main.togglePanel();

  reloadPressed: ->
    @main.reloadConfiguration();

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
      @setRightView(@rightView);
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
    @saveToFile(JSON.stringify(@config, null, '  '));

  saveToFile: (text) ->
    file = new File(@filePath);
    file.writeSync(text);
    @saved = text;

  destroy: ->
    @disposables?.dispose();
