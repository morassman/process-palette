_ = require 'underscore-plus'
{View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'
ButtonsView = require './buttons-view'

module.exports =
class ProcessOutputView extends View

  constructor: (@main, @processController) ->
    super(@main, @processController);
    @lastScrollTop = 0;
    @showProcessOutput();

  @content: (main, processController) ->
    @div =>
      @div {class:"process-palette-process", style:'margin-bottom:5px', outlet:"header"}, =>
        @button {class:'btn btn-xs icon-three-bars inline-block-tight', outlet:'showListViewButton', click:'showListView'}
        # @button {class:'btn btn-xs icon-lock inline-block-tight', outlet:'scrollLockButton', click:'toggleScrollLock'}
        # @button {class:'btn btn-xs icon-trashcan inline-block-tight', outlet:'clearButton', click:'clearOutput'}
        @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'}
        @span {class:'header inline-block text-highlight', outlet: 'commandName'}
        @span {class:'keystroke inline-block highlight', outlet:'keystroke'}
        @span {class:'btn-group'}, =>
          @button {class:'btn btn-xs icon-trashcan', style:'margin-left:15px', outlet:'clearButton', click:'clearOutput'}
          @button {class:'btn btn-xs icon-lock', style:'margin-right:15px', outlet:'scrollLockButton', click:'toggleScrollLock'}
        @subview "buttonsView", new ButtonsView(main, processController.configController);
      @div {class:"process-palette-scrollable native-key-bindings", outlet:'outputPanel', tabindex: -1}

  initialize: ->
    @disposables = new CompositeDisposable();

    fontFamily = atom.config.get("editor.fontFamily");
    @outputPanel.css("font-family", fontFamily);

    @buttonsView.highlight(@processController);

    @addEventHandlers();
    @addToolTips();
    @refreshScrollLockButton();
    @processController.addProcessCallback(@);

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

    @outputPanel.on 'mousedown', (e) =>
      # Only do this while the process is running.
      if @processController.process != null
        @setScrollLockEnabled(true);

    @outputPanel.on 'scroll', (e) =>
      @lastScrollTop = @outputPanel.scrollTop();
      @disableScrollLockIfAtBottom();

  addToolTips: ->
    @disposables.add(atom.tooltips.add(@showListViewButton, {title: 'Return to process list'}));
    @disposables.add(atom.tooltips.add(@scrollLockButton, {title: 'Scroll lock'}));
    @disposables.add(atom.tooltips.add(@clearButton, {title: 'Clear output'}));
    @disposables.add(atom.tooltips.add(@runKillButton, {title: 'Run/Kill process'}));

  disableScrollLockIfAtBottom: ->
    if @processController.process == null
      return;

    if ((@outputPanel.height() + @outputPanel.scrollTop()) == @outputPanel.get(0).scrollHeight)
      # Only do this while the process is running.
      if (@outputPanel.scrollTop() > 0)
        @setScrollLockEnabled(false);
    else
      @setScrollLockEnabled(true);

  parentHeightChanged: (parentHeight) ->
    @calculateHeight();

  attached: ->
    @calculateHeight();

  show: ->
    super();
    @calculateHeight();

  calculateHeight: =>
    @outputPanel.height(@main.mainView.height() - @header.height() - 5);

  processStarted: =>
    @lastScrollTop = 0;
    @showStopIcon();

  processStopped: =>
    @showPlayIcon();

    if !@processController.config.stream
      @refreshOutputPanel();

  setScrollLockEnabled: (enabled) ->
    if @processController.scrollLocked == enabled
      return;

    @processController.scrollLocked = enabled;
    @refreshScrollLockButton();

  toggleScrollLock: ->
    @setScrollLockEnabled(!@processController.scrollLocked);

  refreshScrollLockButton: ->
    @scrollLockButton.removeClass("btn-warning");

    if @processController?.scrollLocked
      @scrollLockButton.addClass("btn-warning");

  showPlayIcon: ->
    # @runKillButton.removeClass('icon-x');
    # @runKillButton.addClass('icon-playback-play');

  showStopIcon: ->
    # @runKillButton.removeClass('icon-playback-play');
    # @runKillButton.addClass('icon-x');

  streamOutput: (output) =>
    @appendOutput(output);

  showProcessOutput: =>
    if @processController.process
      @showStopIcon();
    else
      @showPlayIcon();

    @commandName.text(_.humanizeEventName(@processController.config.getCommandName()));

    if @processController.config.keystroke
      @keystroke.text(_.humanizeKeystroke(@processController.config.keystroke));
      @keystroke.show();
    else
      @keystroke.text("");
      @keystroke.hide();

    @refreshScrollLockButton();
    @refreshOutputPanel();
    @outputPanel.scrollTop(@lastScrollTop);

  clearOutput: ->
    @lastScrollTop = 0;
    @processController.output = "";
    @refreshOutputPanel();

  refreshOutputPanel: =>
    @outputPanel.text("");
    @appendOutput(@processController.output);

  appendOutput: (output) ->
    if output?
      addNewLine = false;
      for line in output.split('\n')
        if addNewLine
          @outputPanel.append("<br>");

        @outputPanel.append(line);
        addNewLine = true;

    @outputChanged();

  outputChanged: ->
    @calculateHeight();

    if !@processController.scrollLocked
      @outputPanel.scrollTop(@outputPanel.get(0).scrollHeight);

  showListView: ->
    @main.showListView();

  runButtonPressed: ->
    @processController.configController.runProcess();

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    if @processController
      @processController.removeProcessCallback(@);

    @buttonsView.destroy();
    @disposables.dispose();
    @element.remove();

  getElement: ->
    return @element;
