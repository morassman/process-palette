{$, $$} = require 'atom-space-pen-views'

module.exports =
class PatternItemView extends HTMLElement

  initialize: (@patternChooseView, @name, @value, select=false) ->
    @checkbox = $$ ->
      @input {type: 'checkbox'}
    button = $$ ->
      @button {class: 'btn btn-sm icon-arrow-up pattern-button'}
    nameSpan = $$ ->
      @span {class: 'pattern-name'}
    expressionSpan = $$ ->
      @span {class: 'text-subtle pattern-expression'}

    nameSpan.text(@name);
    expressionSpan.text(@value.expression);

    button.click => @moveUp();
    button.on 'mousedown', (e) -> e.preventDefault();

    element = $(@);

    button.appendTo(element);
    @checkbox.appendTo(element);
    nameSpan.appendTo(element);
    expressionSpan.appendTo(element);

    @setChecked(select);

  getName: ->
    return @name;

  moveUp: ->
    @patternChooseView.moveUp(@);

  setChecked: (checked) ->
    if !checked?
      checked = false;
    if checked != @isChecked()
      @checkbox.trigger("click");

  isChecked: ->
    return @checkbox.is(":checked");

module.exports = document.registerElement("pattern-item-view", prototype: PatternItemView.prototype, extends: "li")
