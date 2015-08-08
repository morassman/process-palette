HelpView = require './help-view'
ProcessListView = require './process-list-view'
{View} = require 'atom-space-pen-views'

module.exports =
class MainView extends View

  constructor: (@main) ->
    super(@main);

    @showHelp();

  @content: (main) ->
    @div {class: "process-palette"}, =>
      @div {class: "button-group"}, =>
        @button {class:'btn btn-xs icon-question inline-block-tight', outlet: "helpButton", click:'toggleHelp'}
        @button {class:'btn btn-xs icon-chevron-down inline-block-tight', click:'closePressed'}
      @subview "helpView", new HelpView()
      @subview "listView", new ProcessListView(main)

  showProcessList: =>
    @hideHelp();

  toggleHelp: =>
    if @listView.isHidden()
      @hideHelp();
    else
      @showHelp();

  hideHelp: =>
    @helpView.hide();
    @listView.show();
    @helpButton.removeClass("btn-info");

  showHelp: =>
    @listView.hide();
    @helpView.show();
    @helpButton.addClass("btn-info");

  closePressed: =>
    @main.hidePanel();

  reset: =>
    # @listView.showProcessList();
    # @listView.hide();
    # @helpView.show();

  addProcess: (processController) =>
    @listView.addProcess(processController);

    if @listView.isHidden()
      @hideHelp();

  removeProcess: (processController) =>
    @listView.removeProcess(processController);

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @listView.destroy();
    @element.remove();

  getElement: ->
    @element
