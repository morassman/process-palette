/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')

class PatternItemView extends View {

  constructor(patternChooseView, name, value, select = false) {
    super(false)
    this.patternChooseView = patternChooseView
    this.name = name
    this.value = value
    this.select = select
    this.initialize()
  }

  render() {
    return <div>
      <button className="btn btn-sm icon-arrow-up process-palette-pattern-choose-view-button" on={{ click: () => this.moveUp(), mousedown: e => e.preventDefault() }} />
      <input ref="checkbox" type="checkbox" />
      <span className="process-palette-pattern-choose-view-name">{this.name}</span>
      <span className="text-subtle process-palette-pattern-choose-view-expression">{this.value.expression}</span>
    </div>
  }

  initialize() {
    super.initialize()
    this.setChecked(this.select)
  }

  getName() {
    return this.name
  }

  moveUp() {
    this.patternChooseView.moveUp(this)
  }

  setChecked(checked = false) {
    if (this.refs.checkbox.checked !== checked) {
      this.refs.checkbox.checked = checked
    }
  }

  isChecked() {
    return this.refs.checkbox.checked
  }

}

export default class PatternChooseView extends View {

  constructor() {
    super(true)
    this.itemViews = [];
  }

  render() {
    return <div>
      <div className="process-palette-pattern-choose-view">
        <ul ref="list"></ul>
      </div>
    </div>
  }

  setPatterns(patterns, selectedPatternNames) {
    this.patterns = patterns;
    this.reset();
    this.selectPatterns(selectedPatternNames);
  }

  reset() {
    for (let itemView of this.itemViews) {
      this.refs.list.removeChild(itemView.element);
    }

    return this.itemViews = [];
  }

  addRow(name, value, select = false) {
    const itemView = new PatternItemView(this, name, value, select);
    this.itemViews.push(itemView);
    this.refs.list.appendChild(itemView.element)
  }

  moveUp(item) {
    let itemView;
    const index = this.itemViews.indexOf(item);

    if (index === 0) {
      return;
    }

    for (itemView of this.itemViews) {
      this.refs.list.removeChild(itemView.element);
    }

    this.itemViews[index] = this.itemViews[index-1];
    this.itemViews[index-1] = item;

    for (itemView of this.itemViews) {
      this.refs.list.appendChild(itemView.element);
    }
  }

  selectPatterns(patternNames = []) {
    const overrideDefault = (this.patterns['default'] != null);

    for (let patternName of patternNames) {
      if (!overrideDefault && (patternName === 'default')) {
        this.addRow('default', {expression:'(path)'}, true);
      } else {
        let value = this.patterns[patternName];
        if (value != null) {
          this.addRow(patternName, value, true);
        }
      }
    }

    for (let name in this.patterns) {
      let value = this.patterns[name];
      if (patternNames.indexOf(name) === -1) {
        this.addRow(name, value);
      }
    }

    if (!overrideDefault && (patternNames.indexOf('default') === -1)) {
      this.addRow('default', { expression: '(path)' });
    }
  }

  setChecked(checkBox, checked) {
    if ((checked == null)) {
      checked = false;
    }
    if (checked !== this.isChecked(checkBox)) {
      return checkBox.checked = checked;
    }
  }

  isChecked(checkBox) {
    return checkBox.checked;
  }

  getSelectedPatterns() {
    const result = [];

    for (let itemView of this.itemViews) {
      if (itemView.isChecked()) {
        result.push(itemView.getName());
      }
    }

    return result;
  }

}
