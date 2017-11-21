_ = require 'underscore-plus'
{CompositeDisposable} = require 'atom'
{View, TextEditorView} = require 'atom-space-pen-views'
ButtonsView = require './buttons-view'
InsertVariableView = require './edit/insert-variable-view'

module.exports =
class ProcessView extends View

  constructor: (@configController) ->
    super(@configController);
    @configController.addListener(@);

  @content: (configController) ->
    headerArgs = {};
    outputTitleArgs = {};
    outputValueArgs = {};

    if configController.config.outputToPanel()
      headerArgs.class = 'header inline-block text-highlight hand-cursor';
      headerArgs.click = 'showProcessOutput';

      outputTitleArgs.class = 'table-title hand-cursor';
      outputTitleArgs.click = 'showProcessOutput';

      outputValueArgs.class = 'table-value hand-cursor';
      outputValueArgs.click = 'showProcessOutput';
    else
      headerArgs.class = 'header inline-block text-highlight';
      outputTitleArgs.class = 'table-title';
      outputValueArgs.class ='table-value';

    outputTarget = configController.config.outputTarget;
    successOutput = configController.config.successOutput;

    if outputTarget == 'panel'
      outputTarget = '';
    else
      outputTarget = " (#{outputTarget})";

    if configController.config.stream
      successOutput = 'stream';

    @div class:'process-list-item', =>
      @div class: 'process-toolbar', =>
        @button {class:'btn btn-sm btn-fw icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'}
        @button {class:'btn btn-sm btn-fw icon-pencil inline-block-tight', outlet:'editButton', click:'editButtonPressed'}
        @span _.humanizeEventName(configController.config.getCommandName()), headerArgs
        if configController.config.keystroke
          @span _.humanizeKeystroke(configController.config.keystroke), class:'keystroke inline-block highlight'
        @subview 'buttonsView', new ButtonsView(configController);
      @table =>
        @tbody =>
          @tr {outlet: 'commandRow'}, =>
            @td 'Command', class: 'table-title'
            @td =>
              @div {style: "display: flex; align-items: center"}, =>
                @div {style: "flex: 1"}, =>
                  @subview 'commandEditor', new TextEditorView()
                @button 'Insert Variable', {class: 'btn btn-xs insert-button', click: 'insertVariable'}
          @tr {outlet: 'outputRow'}, =>
            @td "Output#{outputTarget}", outputTitleArgs
            @td "#{successOutput}", outputValueArgs
            @td {class: 'table-none'}

  initialize: ->
    @disposables = new CompositeDisposable();
    @disposables.add(atom.tooltips.add(@runButton, {title: 'Run process'}));
    @disposables.add(atom.tooltips.add(@editButton, {title: 'Edit'}));
    @commandEditor.getModel().setText(@configController.config.getFullCommand());
    @commandEditor.addClass('command-editor');
    @commandEditor.addClass('multi-line-editor');
    @commandEditor.getModel().setSoftTabs(true);
    @commandEditor.getModel().setSoftWrapped(true);
    @commandEditor.getModel().setLineNumberGutterVisible(false);
    @commandEditor.getModel().onDidStopChanging () => @commandChanged();
    @applySettings();

    # Prevent the button from getting focus.
    @runButton.on 'mousedown', (e) ->
      e.preventDefault();

  applySettings: ->
    @setCommandVisible(atom.config.get('process-palette.palettePanel.showCommand'));
    @setOutputTargetVisible(atom.config.get('process-palette.palettePanel.showOutputTarget'));

  setCommandVisible: (visible) ->
    if visible
      @commandRow.show();
    else
      @commandRow.hide();

  setOutputTargetVisible: (visible) ->
    if visible
      @outputRow.show();
    else
      @outputRow.hide();

  insertVariable: ->
    new InsertVariableView(@commandEditor);

  commandChanged: ->
    if @initialized
      @configController.setCommand(@commandEditor.getModel().getText());
    else
      @initialized = true;

  showProcessOutput: =>
    processController = @configController.getFirstProcessController();

    if processController != null
      processController.showProcessOutput();

  processStarted: =>
    # @runKillButton.removeClass('icon-playback-play');
    # @runKillButton.addClass('icon-x');

    # if @configController.config.outputToPanel()
      # @showProcessOutput();

  processStopped: =>
    # @runKillButton.removeClass('icon-x');
    # @runKillButton.addClass('icon-playback-play');

  processControllerRemoved: (processController) ->
    # @main.processControllerRemoved(processController);

  runButtonPressed: ->
    @configController.runProcess();

  editButtonPressed: ->
    @configController.guiEdit();

  destroy: ->
    @disposables.dispose();
    @configController.removeListener(@);
    @buttonsView.destroy();
    @element.remove();

  getElement: ->
    return @element;
