_ = require 'underscore-plus'
{$$, View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'
ButtonsView = require './buttons-view'

module.exports =
class ProcessOutputView extends View

  constructor: (@main, @processController) ->
    super(@main, @processController);
    @append(@processController.outputPanel);
    @showProcessOutput();

  @content: (main, processController) ->
    @div =>
      @div {class:"process-palette-process", style:'margin-bottom:5px', outlet:"header"}, =>
        @button {class:'btn btn-xs icon-three-bars inline-block-tight', outlet:'showListViewButton', click:'showListView'}
        @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'}
        @span {class:'header inline-block text-highlight', outlet: 'commandName'}
        @span {class:'keystroke inline-block highlight', outlet:'keystroke'}
        @span {class:'btn-group'}, =>
          @button {class:'btn btn-xs icon-trashcan', style:'margin-left:15px', outlet:'clearButton', click:'clearOutput'}
          @button {class:'btn btn-xs icon-lock', style:'margin-right:15px', outlet:'scrollLockButton', click:'toggleScrollLock'}
        @subview "buttonsView", new ButtonsView(main, processController.configController);

  initialize: ->
    @disposables = new CompositeDisposable();

    fontFamily = atom.config.get("editor.fontFamily");
    @processController.outputPanel.css("font-family", fontFamily);

    @buttonsView.highlight(@processController);

    @addEventHandlers();
    @addToolTips();
    @refreshScrollLockButton();
    @processController.addProcessCallback(@);
    @outputChanged();

  addEventHandlers: ->
    # Prevent the buttons from getting focus.
    @showListViewButton.on 'mousedown', (e) ->
      e.preventDefault();

    @runButton.on 'mousedown', (e) ->
      e.preventDefault();

    @scrollLockButton.on 'mousedown', (e) ->
      e.preventDefault();

    @clearButton.on 'mousedown', (e) ->
      e.preventDefault();

    @processController.outputPanel.on 'mousedown', (e) =>
      # Only do this while the process is running.
      if @processController.process != null
        @setScrollLockEnabled(true);

    @processController.outputPanel.on 'scroll', (e) =>
      @processController.lastScrollTop = @processController.outputPanel.scrollTop();
      @disableScrollLockIfAtBottom();

  addToolTips: ->
    @disposables.add(atom.tooltips.add(@showListViewButton, {title: 'Return to process list'}));
    @disposables.add(atom.tooltips.add(@scrollLockButton, {title: 'Scroll lock'}));
    @disposables.add(atom.tooltips.add(@clearButton, {title: 'Clear output'}));
    @disposables.add(atom.tooltips.add(@runKillButton, {title: 'Run/Kill process'}));

  disableScrollLockIfAtBottom: ->
    if @processController.process == null
      return;

    if ((@processController.outputPanel.height() + @processController.outputPanel.scrollTop()) == @processController.outputPanel.get(0).scrollHeight)
      # Only do this while the process is running.
      if (@processController.outputPanel.scrollTop() > 0)
        @setScrollLockEnabled(false);
    else
      @setScrollLockEnabled(true);

  parentHeightChanged: (parentHeight) ->
    @calculateHeight();

  attached: ->
    @outputChanged();

  show: ->
    super();
    @outputChanged();

  calculateHeight: =>
    @processController.outputPanel.height(@main.mainView.height() - @header.height() - 5);

  processStarted: =>

  processStopped: =>
    @setScrollLockEnabled(false);

  setScrollLockEnabled: (enabled) ->
    if @processController.scrollLocked == enabled
      return;

    @processController.scrollLocked = enabled;
    @refreshScrollLockButton();

  toggleScrollLock: ->
    @setScrollLockEnabled(!@processController.scrollLocked);

  refreshScrollLockButton: ->
    @scrollLockButton.removeClass("btn-warning");

    if @processController.process? and @processController.scrollLocked
      @scrollLockButton.addClass("btn-warning");

  streamOutput: (output) =>
    @outputChanged();

  showProcessOutput: =>
    @commandName.text(_.humanizeEventName(@processController.config.getCommandName()));

    if @processController.config.keystroke
      @keystroke.text(_.humanizeKeystroke(@processController.config.keystroke));
      @keystroke.show();
    else
      @keystroke.text("");
      @keystroke.hide();

    @outputChanged();

  clearOutput: ->
    @processController.lastScrollTop = 0;
    @processController.outputPanel.text("");
    @outputChanged();

  outputChanged: ->
    @calculateHeight();

    if @processController.scrollLocked
      @processController.outputPanel.scrollTop(@processController.lastScrollTop);
    else
      @processController.outputPanel.scrollTop(@processController.outputPanel.get(0).scrollHeight);

    @refreshScrollLockButton();

  showListView: ->
    @main.showListView();

  runButtonPressed: ->
    @processController.configController.runProcess();

  # Tear down any state and detach
  destroy: ->
    if @processController
      @processController.removeProcessCallback(@);

    @buttonsView.destroy();
    @disposables.dispose();
    @element.remove();

  getElement: ->
    return @element;
