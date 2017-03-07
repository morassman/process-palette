_ = require 'underscore-plus'
{$$, View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'
ButtonsView = require './buttons-view'
PathView = require './path-view'
escapeHTML = require 'underscore.string/escapeHTML'
AnsiToHtml = require 'ansi-to-html'
fsp = require 'fs-plus'

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
    @div =>
      @div {class:"process-palette-process", style:'margin-bottom:5px', outlet:"header"}, =>
        @button {class:'btn btn-xs icon-three-bars inline-block-tight', outlet:'showListViewButton', click:'showListView'}
        @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'}
        @span {class:'header inline-block text-highlight', outlet: 'commandName'}
        @span {class:'keystroke inline-block highlight', outlet:'keystroke'}
        @span {class:'btn-group'}, =>
          @button {class:'btn btn-xs icon-trashcan', style:'margin-left:15px', outlet:'clearButton', click:'clearOutput'}
          @button {class:'btn btn-xs icon-lock', style:'margin-right:15px', outlet:'scrollLockButton', click:'toggleScrollLock'}
        @subview "buttonsView", new ButtonsView(main, processController.configController, processController);
      @div {class:"process-palette-output-panel native-key-bindings", tabindex: -1, outlet:'outputPanel'}

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
      if @processController.process != null
        @setScrollLockEnabled(true);

    @outputPanel.on 'scroll', (e) =>
      @lastScrollTop = @outputPanel.scrollTop();
      @disableScrollLockIfAtBottom();

  addToolTips: ->
    @disposables.add(atom.tooltips.add(@showListViewButton, {title: 'Show palette'}));
    @disposables.add(atom.tooltips.add(@scrollLockButton, {title: 'Scroll lock'}));
    @disposables.add(atom.tooltips.add(@clearButton, {title: 'Clear output'}));
    @disposables.add(atom.tooltips.add(@runButton, {title: 'Run process'}));

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
    @outputChanged();

  show: ->
    super();
    @outputChanged();

  calculateHeight: =>
    @outputPanel.height(@main.mainView.height() - @header.height() - 5);

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
    addNewLine = false;

    for line in text.split('\n')
      if addNewLine
        @outputPanel.append("<br>");
        @lineIndex++;
      @appendLine(line);
      addNewLine = true;

  # append line to output panel
  #   - detect line patterns and assign css class
  #   - detect path patterns and create PathView
  #   - part after path is recursively appended again
  #       - match_line == undefined : start of line
  #       - match_line != undefined : line continuation after path match
  #          - suppress line pattern matching
  #          - use match_line for line class
  #          - match_line == null : line continuation, but no line class was detected
  appendLine: (line, match_line) ->

    match_path = null
    if match_line == undefined
      continuation = false
      match_line = null
    else
      continuation = true

    for pattern in @patterns
      if pattern.config.isPathExpression
        match = pattern.match(line);
        if not match_path and match? and fsp.isFileSync(match.path)
          cwd = @processController.getCwd();
          match_path = {
            pre:  match.pre,
            path: new PathView(cwd, match),
            post: match.post
            };
          line = match.pre + "<FILE>" + match.post
      else
        if not continuation and not match_line and line.match(pattern.regex)
          match_line = pattern.config.name;
      if match_path and match_line
        break;
        
    if match_line
      if match_path
        pre = @sanitizeOutput(match_path.pre)
        @outputPanel.append(
          $$ ->
            @span {class: match_line}, =>
              @raw(pre)
              @span =>
                @subview "#{@lineIndex}", match_path.path
          )
        if match_path.post.length > 0
          @appendLine(match_path.post, match_line)
      else
        line = @sanitizeOutput(line)
        @outputPanel.append(
          $$ ->
            @span {class: match_line}, => @raw(line)
          )
    else
      if match_path
        pre = @sanitizeOutput(match_path.pre)
        @outputPanel.append(pre);
        @outputPanel.append(match_path.path);
        if match_path.post.length > 0
          @appendLine(match_path.post, false)
      else
        line = @sanitizeOutput(line)
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
