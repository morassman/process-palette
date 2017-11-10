{$, View} = require 'atom-space-pen-views'

module.exports =
class SplitView extends View

  constructor: (@position = 250, @leftMin = 0, @rightMin = 0, @leftMax = undefined) ->
    super();
    if !@leftMax
      @leftMax = Number.MAX_SAFE_INTEGER;

  @content: ->
    @div {class: 'split-view'}, =>
      @div {class: 'left', outlet: 'left'}
      @div class: 'divider'
      @div {class: 'right', outlet: 'right'}

  getTitle: ->
    return 'SplitView';

  setLeftView: (leftView) ->
    if @leftView?
      @leftView.remove();

    if !leftView?
      leftView = $$ ->
        @div

    @leftView = leftView;

    if @leftView?
      @leftView.css('height', '100%');
      @leftView.css('overflow', 'auto');
      @left.prepend(@leftView);

    @setPosition(@position);

  setRightView: (rightView) ->
    if @rightView?
      @rightView.remove();

    if !rightView?
      rightView = $$ ->
        @div

    @rightView = rightView;

    if @rightView?
      @rightView.css('height', '100%');
      @rightView.css('overflow', 'auto');
      @right.prepend(@rightView);

    @setPosition(@position);

  initialize: ->
    @on 'mousedown', '.divider', (e) => @resizeStarted(e);

  attached: ->
    @setPosition(@position);
    $(document).on('resize', @refreshPosition);
    $(window).on('resize', @refreshPosition);

  detached: ->
    $(window).off('resize', @refreshPosition);

  resizeStarted: (e) =>
    e.preventDefault();
    $(document).on('mousemove', @resizeView)
    $(document).on('mouseup', @resizeStopped)

  resizeStopped: =>
    $(document).off('mousemove', @resizeView)
    $(document).off('mouseup', @resizeStopped)

  resizeView: (e) =>
    e.preventDefault();
    return @resizeStopped() unless e.which is 1
    x = e.pageX - @left.offset().left;
    if x > @leftMin and x < @leftMax and x < (@width() - @rightMin)
      @setPosition(x);

  refreshPosition: =>
    @setPosition(@position);

  setPosition: (@position) ->
    @left.css('width', @position);
    @right.css('margin-left', @position+3);
    @right.css('width', @width() - @position - 3);

    @leftView?.css('width', '100%');
    @rightView?.css('width', '100%');
    @leftView?.css('width', @position);
    @rightView?.css('width', @width() - @position - 3);
