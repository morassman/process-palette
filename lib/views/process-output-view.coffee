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
      @div {class:"process-palette-process", outlet:"header"}, =>
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

    #console.log "<< " + line

    #@outputPanel.append @sanitizeOutput(line) + "<br>"

    ##### process path patterns
    line_parts = [line]
    for pattern in @patterns
      #console.log(["pattern", pattern.config.name, remaining])
      if pattern.config.isPathExpression
        # process all parts and build new line_parts array
        #console.log(["line_parts", line_parts])
        parts = line_parts
        line_parts = []
        for part in parts
          if typeof part != "string"
            # copy non-string parts (already processed)
            #console.log(["+ + push", part])
            line_parts.push part
          else
            # match string parts
            remaining = part
            while remaining.length > 0
              matches = pattern.match(remaining)
              if matches?
                #console.log ["+ path match", matches.match, matches.path, remaining]
                line_parts.push matches.pre
                # TODO: search in some path (active project, active-file, other projects, other open files)
                if fsp.isFileSync(matches.path)
                  #console.log ["+ path exist", matches.match, remaining]
                  cwd = @processController.getCwd()
                  obj = new PathView(cwd, matches)
                  obj.addClass(pattern.config.name)
                  obj.name = "path"
                  #console.log(["+ + push", obj])
                  line_parts.push obj
                else
                  line_parts.push matches.match
                # continue with string following match
                remaining = matches.post
                #console.log(["remaining", remaining])
              else
                break
              #console.log(["line_parts", line_parts, "--> " +  remaining])
            if remaining.length >= 0
              line_parts.push remaining
        # concatenate strings following strings
        parts = line_parts
        line_parts = []
        combined = ""
        for part in parts
          if typeof part != "string"
            if combined.length
              line_parts.push combined
              combined = ""
            line_parts.push part
          else
            combined += part
        if combined.length
          line_parts.push combined
      #console.log(["line_parts", line_parts])

    ##### process inline patterns
    for pattern in @patterns
      #console.log(["pattern", pattern.config.name])
      if pattern.config.isInlineExpression
        # process all parts and build new line_parts array
        #console.log(["pattern", pattern.config.name])
        #console.log(["line_parts", line_parts])
        parts = line_parts
        line_parts = []
        for part in parts
          if typeof part == "object"
            # copy non-string parts (already processed)
            #console.log(["push", part])
            line_parts.push part
          else
            # match string parts
            remaining = part
            while remaining.length > 0
              matches = pattern.match(remaining)
              if matches?
                #console.log(["expr match", remaining])
                #console.log(JSON.stringify(matches, null, "  "))
                # copy string in front of match
                line_parts.push matches.pre
                # build span
                text = @sanitizeOutput(matches.match)
                obj = $$ -> @span {class: pattern.config.name}, =>  @raw(text)
                obj.name = pattern.config.name
                #console.log(["push", obj])
                line_parts.push obj
                # continue with string following match
                remaining = matches.post
                #console.log(["remaining", remaining])
              else
                break
              #console.log(["line_parts", line_parts, "--> " +  remaining])
            if remaining.length >= 0
              line_parts.push remaining
      #console.log(["line_parts", line_parts])

    ##### replace all objects in line for whole-line matching
    # line_processed = ""
    # for part in line_parts
    #   if typeof part == "string"
    #     line_processed += part
    #   else
    #     line_processed += "<" + part.name + ">"
    #console.log("== " + line_processed)

    ##### (whole-)line matching
    for pattern in @patterns
      if pattern.config.isLineExpression
        matches = pattern.match(line)
        if matches?
          #console.log(["line match", matches.match, line_processed])
          line_span = $$ -> @span {class: pattern.config.name}
          for part in line_parts
            if typeof part == "string"
              text = @sanitizeOutput(part)
              line_span.append $$ -> @raw(text)
            else
              line_span.append part
          #console.log "\n\n--- line_span\n" + line_span[0].innerHTML + "\n---\n\n"
          @outputPanel.append(line_span)
          return

    # no (while-)line match
    for part in line_parts
      if typeof part == "string"
        part = @sanitizeOutput(part)
      else
        #console.log "\n\n--- part\n" + part[0].innerHTML + "\n---\n\n"
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
