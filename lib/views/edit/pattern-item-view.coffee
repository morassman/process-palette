{$, View} = require 'atom-space-pen-views'

module.exports =
class PatternItemView extends View

  constructor: (@patternChooseView, @name, @value, select=true) ->
    super(@patternChooseView, @name, @value, select=false)

  @content: (patternChooseView, name, value, select) ->
    @li =>
      @input {outlet: "selectButton", type: 'checkbox', class: "select input-checkbox", value: select}
      @button {outlet: "upButton", class: 'btn btn-sm icon icon-arrow-up pattern-button'}
      @span name, {outlet: "nameSpan", class: 'pattern-name'}
      @span value.expression, {outlet: "expressionSpan", class: 'text-subtle pattern-expression'}

  initialize: ->
    @upButton.click => @patternChooseView.moveUp(@);
    @upButton.on 'mousedown', (e) -> e.preventDefault();

  getName: ->
    return @name;

  setChecked: (checked) ->
    if !checked?
      checked = false;
    if checked != @isChecked()
      @selectButton.trigger("click");

  isChecked: ->
    return @selectButton.is(":checked");
