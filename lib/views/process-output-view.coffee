_ = require 'underscore-plus'
{View} = require 'atom-space-pen-views'

module.exports =
class ProcessOutputView extends View

  constructor: (@processListView, @processController) ->
    super(@processListView, @processController);
    @processController.addProcessCallback(@);
    @showOutput();

  @content: (processListView, processController) ->
    @div =>
      @div class:"process", =>
        @button {class:'btn btn-xs icon-three-bars inline-block-tight', click:'showProcessList'}
        @button {class:'btn btn-xs icon-playback-play inline-block-tight', outlet:'runKillButton', click:'runKillProcess'}
        @span _.humanizeEventName(processController.config.getCommandName()), class:'header inline-block text-highlight'
        if processController.config.keystroke
          @span _.humanizeKeystroke(processController.config.keystroke), class:'keystroke inline-block highlight'
      @div {class:"scrollable height:100px", outlet:'outputPanel'}

  processStarted: =>
    @runKillButton.removeClass('icon-playback-play');
    @runKillButton.addClass('icon-x');

  processStopped: =>
    @runKillButton.removeClass('icon-x');
    @runKillButton.addClass('icon-playback-play');

    @showOutput();

  showOutput: =>
    if @processController.output
      @outputPanel.text("");

      for line in @processController.output.split('\n')
        @outputPanel.append(line);
        @outputPanel.append("<br>");

  showProcessList: ->
    @processListView.showProcessList();

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
