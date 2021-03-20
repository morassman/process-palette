/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let PatternChooseView;
const {View} = require('atom-space-pen-views');
const PatternItemView = require('./pattern-item-view');

module.exports =
(PatternChooseView = class PatternChooseView extends View {

  constructor() {
    super();
    this.itemViews = [];
  }

  static content() {
    return this.div(() => {
      return this.div({class: 'pattern-choose-view'}, () => {
        return this.ul({class: 'list-group', outlet: 'list'});
    });
  });
  }

  setPatterns(patterns, selectedPatternNames) {
    this.patterns = patterns;
    this.reset();
    return this.selectPatterns(selectedPatternNames);
  }

  reset() {
    for (let itemView of Array.from(this.itemViews)) {
      this.list[0].removeChild(itemView);
    }

    return this.itemViews = [];
  }

  addRow(name, value, select) {
    if (select == null) { select = false; }
    const itemView = new PatternItemView();
    itemView.initialize(this, name, value, select);
    this.itemViews.push(itemView);
    return this.list[0].appendChild(itemView);
  }

  moveUp(item) {
    let itemView;
    const index = this.itemViews.indexOf(item);

    if (index === 0) {
      return;
    }

    for (itemView of Array.from(this.itemViews)) {
      this.list[0].removeChild(itemView);
    }

    this.itemViews[index] = this.itemViews[index-1];
    this.itemViews[index-1] = item;

    return (() => {
      const result = [];
      for (itemView of Array.from(this.itemViews)) {
        result.push(this.list[0].appendChild(itemView));
      }
      return result;
    })();
  }

  selectPatterns(patternNames) {
    let patternName, value;
    if ((patternNames == null)) {
      patternName = [];
    }

    const overrideDefault = (this.patterns['default'] != null);

    for (patternName of Array.from(patternNames)) {
      if (!overrideDefault && (patternName === 'default')) {
        this.addRow('default', {expression:'(path)'}, true);
      } else {
        value = this.patterns[patternName];
        if (value != null) {
          this.addRow(patternName, value, true);
        }
      }
    }

    for (let name in this.patterns) {
      value = this.patterns[name];
      if (patternNames.indexOf(name) === -1) {
        this.addRow(name, value);
      }
    }

    if (!overrideDefault && (patternNames.indexOf('default') === -1)) {
      return this.addRow('default', {expression:'(path)'});
    }
  }

  setChecked(checkBox, checked) {
    if ((checked == null)) {
      checked = false;
    }
    if (checked !== this.isChecked(checkBox)) {
      return checkBox.trigger("click");
    }
  }

  isChecked(checkBox) {
    return checkBox.is(":checked");
  }

  getSelectedPatterns() {
    const result = [];

    for (let itemView of Array.from(this.itemViews)) {
      if (itemView.isChecked()) {
        result.push(itemView.getName());
      }
    }

    return result;
  }
});
