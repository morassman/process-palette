/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let PatternItemView;
const {$, $$} = require('atom-space-pen-views');

module.exports =
(PatternItemView = class PatternItemView extends HTMLElement {

  initialize(patternChooseView, name, value, select) {
    this.patternChooseView = patternChooseView;
    this.name = name;
    this.value = value;
    if (select == null) { select = false; }
    this.checkbox = $$(function() {
      return this.input({type: 'checkbox'});});
    const button = $$(function() {
      return this.button({class: 'btn btn-sm icon-arrow-up pattern-button'});});
    const nameSpan = $$(function() {
      return this.span({class: 'pattern-name'});});
    const expressionSpan = $$(function() {
      return this.span({class: 'text-subtle pattern-expression'});});

    nameSpan.text(this.name);
    expressionSpan.text(this.value.expression);

    button.click(() => this.moveUp());
    button.on('mousedown', e => e.preventDefault());

    const element = $(this);

    button.appendTo(element);
    this.checkbox.appendTo(element);
    nameSpan.appendTo(element);
    expressionSpan.appendTo(element);

    return this.setChecked(select);
  }

  getName() {
    return this.name;
  }

  moveUp() {
    return this.patternChooseView.moveUp(this);
  }

  setChecked(checked) {
    if ((checked == null)) {
      checked = false;
    }
    if (checked !== this.isChecked()) {
      return this.checkbox.trigger("click");
    }
  }

  isChecked() {
    return this.checkbox.is(":checked");
  }
});

module.exports = document.registerElement("pattern-item-view", {prototype: PatternItemView.prototype, extends: "li"});
