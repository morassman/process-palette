{View} = require 'atom-space-pen-views'
PatternItemView = require './pattern-item-view'

module.exports =
class PatternChooseView extends View

  constructor: ->
    super();
    @itemViews = [];

  @content: ->
    @div =>
      @div {class: 'pattern-choose-view'}, =>
        @ul {class: 'list-group', outlet: 'list'}

  setPatterns: (@patterns, selectedPatternNames) ->
    @reset();
    @selectPatterns(selectedPatternNames);

  reset: ->
    for itemView in @itemViews
      @list[0].removeChild(itemView);

    @itemViews = [];

  addRow: (name, value, select=false) ->
    itemView = new PatternItemView();
    itemView.initialize(@, name, value, select);
    @itemViews.push(itemView);
    @list[0].appendChild(itemView);

  moveUp: (item) ->
    index = @itemViews.indexOf(item);

    if index == 0
      return;

    for itemView in @itemViews
      @list[0].removeChild(itemView);

    @itemViews[index] = @itemViews[index-1];
    @itemViews[index-1] = item;

    for itemView in @itemViews
      @list[0].appendChild(itemView);

  selectPatterns: (patternNames) ->
    if !patternNames?
      patternName = [];

    overrideDefault = @patterns['default']?;

    for patternName in patternNames
      if !overrideDefault and patternName == 'default'
        @addRow('default', {expression:'(path)'}, true);
      else
        value = @patterns[patternName];
        if value?
          @addRow(patternName, value, true);

    for name, value of @patterns
      if patternNames.indexOf(name) == -1
        @addRow(name, value);

    if !overrideDefault and patternNames.indexOf('default') == -1
      @addRow('default', {expression:'(path)'});

  setChecked: (checkBox, checked) ->
    if !checked?
      checked = false;
    if checked != @isChecked(checkBox)
      checkBox.trigger("click");

  isChecked: (checkBox) ->
    return checkBox.is(":checked");

  getSelectedPatterns: ->
    result = [];

    for itemView in @itemViews
      if itemView.isChecked()
        result.push(itemView.getName());

    return result;
