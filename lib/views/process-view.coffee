_ = require 'underscore-plus'
{View} = require 'atom-space-pen-views'

module.exports =
class ProcessView extends View

  constructor: (@processListView, @processController) ->
    super(@processListView, @processController);
    @processController.addProcessCallback(@);

  @content: (processListView, processController) ->
    @div class:"process", =>
      @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runKillButton', click:'runKillProcess'}
      @span _.humanizeEventName(processController.config.getCommandName()), {class:'header inline-block text-highlight', click:'showProcessOutput'}
      if processController.config.keystroke
        @span _.humanizeKeystroke(processController.config.keystroke), class:'keystroke inline-block highlight'
      @table =>
        @tbody =>
          @tr =>
            @td "Command", class:'table-title'
            @td "#{processController.config.getFullCommand()}"
          @tr =>
            @td "Output (#{processController.config.outputTarget})", class:'table-title'
            @td "#{processController.config.successOutput}"

  showProcessOutput: =>
    @processListView.showProcessOutput(@processController);

  processStarted: =>
    @runKillButton.removeClass('icon-playback-play');
    @runKillButton.addClass('icon-x');

    if @processController.config.outputTarget == null
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
