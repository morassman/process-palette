_ = require 'underscore-plus'
{View} = require 'atom-space-pen-views'

module.exports =
class ProcessView extends View

  constructor: (@main, @processController) ->
    super(@main, @processController);
    @processController.addProcessCallback(@);

  @content: (main, processController) ->
    headerArgs = {};
    outputTitleArgs = {};
    outputValueArgs = {};

    if processController.config.outputToPanel()
      headerArgs.class = 'header inline-block text-highlight hand-cursor';
      headerArgs.click = 'showProcessOutput';

      outputTitleArgs.class = 'table-title hand-cursor';
      outputTitleArgs.click = 'showProcessOutput';

      outputValueArgs.class = 'hand-cursor';
      outputValueArgs.click = 'showProcessOutput';
    else
      headerArgs.class = 'header inline-block text-highlight';
      outputTitleArgs.class = 'table-title';

    outputTarget = processController.config.outputTarget;

    if outputTarget == "panel"
      outputTarget = "";
    else
      outputTarget = " (#{outputTarget})";

    @div class:"process", =>
      @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runKillButton', click:'runKillProcess'}
      @span _.humanizeEventName(processController.config.getCommandName()), headerArgs
      if processController.config.keystroke
        @span _.humanizeKeystroke(processController.config.keystroke), class:'keystroke inline-block highlight'
      @table =>
        @tbody =>
          @tr =>
            @td "Command", class:'table-title'
            @td "#{processController.config.getFullCommand()}"
          @tr =>
            @td "Output#{outputTarget}", outputTitleArgs
            @td "#{processController.config.successOutput}", outputValueArgs

  showProcessOutput: =>
    @main.showProcessOutput(@processController);

  processStarted: =>
    @runKillButton.removeClass('icon-playback-play');
    @runKillButton.addClass('icon-x');

    if @processController.config.outputToPanel()
      @showProcessOutput();

  processStopped: =>
    @runKillButton.removeClass('icon-x');
    @runKillButton.addClass('icon-playback-play');

  runKillProcess: ->
    @processController.runKillProcess();

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @processController.removeProcessCallback(@);
    @element.remove()

  getElement: ->
    @element
