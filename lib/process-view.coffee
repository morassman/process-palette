_ = require 'underscore-plus'
{View} = require 'atom-space-pen-views'

module.exports =
class ProcessView extends View

  constructor: (@processController) ->
    super(@processController);
    @processController.addProcessCallbacks(@processStarted, @processStopped);

  @content: (processController) ->
    title = _.humanizeEventName(processController.config.getCommandName());

    if processController.config.keystroke
      title += " (" + _.humanizeKeystroke(processController.config.keystroke) + ")";

    @div class:"process", =>
      @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runKillButton', click:'runKillProcess'}
      @span title, class:'header inline-block text-highlight'
      @table =>
        @tbody =>
          @tr =>
            @td "Command", class:'table-title'
            @td "#{processController.config.getFullCommand()}"
          @tr =>
            @td "Output (#{processController.config.outputTarget})", class:'table-title'
            @td "#{processController.config.successOutput}"

  processStarted: =>
    @runKillButton.removeClass('icon-playback-play');
    @runKillButton.addClass('icon-x');

  processStopped: =>
    @runKillButton.removeClass('icon-x');
    @runKillButton.addClass('icon-playback-play');

  runKillProcess: ->
    @processController.runKillProcess();

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    @element
