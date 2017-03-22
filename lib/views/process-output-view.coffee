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
  #   uses three kinds of patterns (processed in three loops in this sequence):
  #     * PTHEXP = path expression
  #     * INLEXP = inline expression
  #     * LINEXP = (whole-)line expression
  #   * PTHEXPs are roughly the same as INLEXPs, but create clickable objects (PathView)
  #   * PTHEXPs only match if a corresponding file exists (this allows very loose path regexps)
  #   * INLEXPs are converted to span objects
  #   * converting is done sequentially: remaining = match(line) ; while(remaining) remaining = match(remaining)
  #   * resulting objects and the remaining strings are collected in an array (line_parts)
  #   * LINEXPs are detected by using `^` at the start
  #   *   because of that INLEXP anchored at the start of the line need to use a fake group or similar
  #   * the first matching LINEXP stops matching outputs a span object wrapping the collected array

  appendLine: (line) ->

    #console.log("<< " + line)

    #@outputPanel.append @sanitizeOutput(line) + "<br>"

    ##### process path patterns
    line_parts = []
    remaining = line
    any_match = true
    while remaining.length > 0 and any_match
      any_match = false
      for pattern in @patterns
        #console.log(["pattern", pattern.config.name, pattern.config.isLineExpression, pattern.config.isPathExpression, pattern])
        if pattern.config.isPathExpression
          matches = pattern.match(remaining)
          if matches?
            #console.log(["path match", matches.match, remaining])
            if fsp.isFileSync(matches.path)
              any_match = true
              #console.log(["path exist", matches.match, remaining])
              cwd = @processController.getCwd()
              line_parts.push matches.pre
              obj = new PathView(cwd, matches)
              obj.name = "path"
              line_parts.push obj
              remaining = matches.post
              break # process remaining
            remaining = matches.post
            line_parts.push matches.pre + matches.match
    if remaining.length >= 0
      line_parts.push remaining

    ##### process inline patterns
    for pattern in @patterns
      #console.log(["pattern", pattern.config.name, remaining])
      if pattern.config.isInlineExpression
        # process all parts and build new line_parts array
        #console.log(["line_parts", line_parts])
        parts = line_parts
        line_parts = []
        for part in parts
          if typeof part != "string"
            # copy non-string parts (already processed)
            #console.log(["push", part])
            line_parts.push part
          else
            # match string parts
            remaining = part
            while remaining.length > 0
              matches = pattern.match(remaining)
              if matches?
                #console.log(["expr match", matches, remaining])
                # copy string in front of match
                #console.log(["push", matches.pre])
                line_parts.push matches.pre
                # build span
                obj = $$ -> @span {class: pattern.config.name}, => @raw(matches.match)
                obj.name = pattern.config.name
                #console.log(["push", obj])
                line_parts.push obj
                # continue with string following match
                remaining = matches.post
                #console.log(["remaining", remaining])
              else
                break
            if remaining.length >= 0
              line_parts.push remaining
          #console.log(["line_parts", line_parts, "--> " +  remaining])
      #console.log(["line_parts", line_parts])

    ##### replace all objects in line for whole-line matching
    line_processed = ""
    for part in line_parts
      if typeof part == "string"
        line_processed += part
      else
        line_processed += "<" + part.name + ">"
    #console.log("== " + line_processed)

    ##### (whole-)line matching
    for pattern in @patterns
      if pattern.config.isLineExpression
        matches = line_processed.match(pattern.regex)
        if matches?
          #console.log(["line match", matches.match, line_processed])
          line_span = $$ -> @span {class: pattern.config.name}
          for part in line_parts
            if typeof part == "string"
              line_span.append $$ -> @text(part)
            else
              line_span.append part
          @outputPanel.append(line_span)
          return

    for part in line_parts
      if typeof part == "string"
        part = @sanitizeOutput(part)
      @outputPanel.append(part)

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
