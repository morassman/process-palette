_ = require 'underscore-plus'
{View} = require 'atom-space-pen-views'

module.exports =
class ProcessOutputView extends View

  constructor: (@main) ->
    super(@main);

  @content: (main) ->
    @div {class: "processOutput"}, =>
      @div {class:"process", outlet:"header"}, =>
        @button {class:'btn btn-xs icon-three-bars inline-block-tight', click:'showListView'}
        @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runKillButton', click:'runKillProcess'}
        @span {class:'header inline-block text-highlight', outlet: 'commandName'}
        @span {class:'keystroke inline-block highlight', outlet:'keystroke'}
      @div {class:"scrollable native-key-bindings", outlet:'outputPanel', tabindex: -1}

  attached: ->
    @calculateHeight();

  calculateHeight: =>
    @outputPanel.height(@main.mainView.height() - @header.height());

  processStarted: =>
    @runKillButton.removeClass('icon-playback-play');
    @runKillButton.addClass('icon-x');

  processStopped: =>
    @runKillButton.removeClass('icon-x');
    @runKillButton.addClass('icon-playback-play');

    if !@processController.config.stream
      @refreshOutputPanel();

  streamOutput: (output) =>
    @appendOutput(output);

  showProcessOutput: (processController) =>
    if @processController
      @processController.removeProcessCallback(@);

    @processController = processController;
    @processController.addProcessCallback(@);

    if @processController.process
      @processStarted();

    @commandName.text(_.humanizeEventName(@processController.config.getCommandName()));

    if @processController.config.keystroke
      @keystroke.text(_.humanizeKeystroke(@processController.config.keystroke));
      @keystroke.show();
    else
      @keystroke.text("");
      @keystroke.hide();

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

    @calculateHeight();

  showListView: ->
    @main.showListView();

  runKillProcess: ->
    @processController.runKillProcess();

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    if @processController
      @processController.removeProcessCallback(@);

    @element.remove()

  getElement: ->
    @element
