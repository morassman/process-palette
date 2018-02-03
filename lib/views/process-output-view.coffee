_ = require 'underscore-plus'
{$$, View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'
ButtonsView = require './buttons-view'
PathView = require './path-view'
escapeHTML = require 'underscore.string/escapeHTML'
AnsiToHtml = require 'ansi-to-html'

module.exports =
class ProcessOutputView extends View

  constructor: (@main, @processController) ->
    super(@main, @processController);
    @lastScrollTop = 0;
    @scrollLocked = false;
    @ansiConvert = new AnsiToHtml({stream:true});
    @lineIndex = 0;
    @patterns = @processController.configController.patterns;

    @addProcessDetails();
    @setScrollLockEnabled(@processController.config.scrollLockEnabled);

  @content: (main, processController) ->
    @div {class:'process-output-view'}, =>
      @div {class:'process-list-item', outlet:'header'}, =>
        @div {class:'process-toolbar'}, =>
          @button {class:'btn btn-sm btn-fw icon-three-bars inline-block-tight', outlet:'showListViewButton', click:'showListView'}
          @button {class:'btn btn-sm btn-fw icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'}
          @span {class:'header inline-block text-highlight', outlet: 'commandName'}
          @span {class:'keystroke inline-block highlight', outlet:'keystroke'}
          @span {class:'btn-group'}, =>
            @button {class:'btn btn-sm btn-fw icon-trashcan', outlet:'clearButton', click:'clearOutput'}
            @button {class:'btn btn-sm btn-fw icon-lock', style:'margin-right:15px', outlet:'scrollLockButton', click:'toggleScrollLock'}
          @subview "buttonsView", new ButtonsView(processController.configController, processController);
      @div {class:"output-panel native-key-bindings", tabindex: -1, outlet:'outputPanel'}

  initialize: ->
    @disposables = new CompositeDisposable();

    fontFamily = atom.config.get("editor.fontFamily");
    @outputPanel.css("font-family", fontFamily);

    @addEventHandlers();
    @addToolTips();
    @refreshScrollLockButton();
    @processController.addProcessCallback(@);
    @outputChanged();

  addProcessDetails: =>
    @commandName.text(_.humanizeEventName(@processController.config.getCommandName()));

    if @processController.config.keystroke
      @keystroke.text(_.humanizeKeystroke(@processController.config.keystroke));
      @keystroke.show();
    else
      @keystroke.text("");
      @keystroke.hide();

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
      if @processController.process
        @setScrollLockEnabled(true);

    @outputPanel.on 'mousewheel', (e) =>
      if !@processController.process
        return;

      delta = e.originalEvent.deltaY;

      if delta < 0
        @setScrollLockEnabled(true);
      else if delta > 0
        @disableScrollLockIfAtBottom();

    @outputPanel.on 'scroll', (e) =>
      @lastScrollTop = @outputPanel.scrollTop();

  addToolTips: ->
    @disposables.add(atom.tooltips.add(@showListViewButton, {title: 'Show palette'}));
    @disposables.add(atom.tooltips.add(@scrollLockButton, {title: 'Scroll lock'}));
    @disposables.add(atom.tooltips.add(@clearButton, {title: 'Clear output'}));
    @disposables.add(atom.tooltips.add(@runButton, {title: 'Run process'}));

  disableScrollLockIfAtBottom: ->
    if ((@outputPanel.height() + @outputPanel.scrollTop()) == @outputPanel.get(0).scrollHeight)
      if (@outputPanel.scrollTop() > 0)
        @setScrollLockEnabled(false);
    # else
      # @setScrollLockEnabled(true);

  parentHeightChanged: (parentHeight) ->
    @calculateHeight();

  attached: ->
    @outputChanged();

  show: ->
    super();
    @outputChanged();

  calculateHeight: =>
    # @outputPanel.height(@main.mainView.height() - @header.height() - 5);

  processStarted: =>

  processStopped: =>

  setScrollLockEnabled: (enabled) ->
    if @scrollLocked == enabled
      return;

    @scrollLocked = enabled;
    @refreshScrollLockButton();

  showListView: ->
    @main.showListView();

  runButtonPressed: ->
    @processController.configController.runProcess();

  toggleScrollLock: ->
    @setScrollLockEnabled(!@scrollLocked);

  refreshScrollLockButton: ->
    @scrollLockButton.removeClass("btn-warning");

    if @scrollLocked
      @scrollLockButton.addClass("btn-warning");

  streamOutput: (output) =>
    @outputChanged();

  clearOutput: ->
    @lastScrollTop = 0;
    @outputPanel.text("");
    @outputChanged();

  outputChanged: ->
    @calculateHeight();

    if @scrollLocked
      @outputPanel.scrollTop(@lastScrollTop);
    else
      @outputPanel.scrollTop(@outputPanel.get(0).scrollHeight);

    @refreshScrollLockButton();

  outputToPanel: (text) ->
    text = @sanitizeOutput(text);
    addNewLine = false;

    for line in text.split('\n')
      if addNewLine
        @outputPanel.append("<br>");
        @lineIndex++;
      @appendLine(line);
      addNewLine = true;

  appendLine: (line) ->
    if @patterns.length == 0
      @outputPanel.append(line);
      return;

    for pattern in @patterns
      match = pattern.match(line);

      if match?
        cwd = @processController.getCwd();
        pathView = new PathView(cwd, match);
        @outputPanel.append(match.pre);
        @outputPanel.append $$ ->
          @span =>
            @subview "#{@lineIndex}", pathView
        @outputPanel.append(match.post);
        return;

    @outputPanel.append(line);

  # Tear down any state and detach
  destroy: ->
    if @processController
      @processController.removeProcessCallback(@);

    @buttonsView.destroy();
    @disposables.dispose();
    @element.remove();

  getElement: ->
    return @element;

  sanitizeOutput: (output) ->
    # Prevent HTML in output from being parsed as HTML
    output = escapeHTML(output);
    # Convert ANSI escape sequences (ex. colors) to HTML
    output = @ansiConvert.toHtml(output);

    return output;
