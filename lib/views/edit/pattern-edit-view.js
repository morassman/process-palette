/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let PatternEditView;
const {View} = require('atom-space-pen-views');
const TableEditView = require('./table-edit-view');

module.exports =
(PatternEditView = class PatternEditView extends View {

  constructor(config) {
    this.config = config;
    super();
  }

  static content() {
    return this.div(() => {
      return this.div({class: 'pattern-edit-view'}, () => {
        this.div({class: 'header'}, () => {
          return this.h1('Edit Patterns');
        });
        this.span('Patterns are used to detect file paths and line number in the output when shown in the ');
        this.span('panel', {class: 'text-highlight'});
        this.span(' target. Each command can have its own patterns configured.');
        this.tag('p');
        this.span(' The ');
        this.span('Expression', {class: 'text-highlight'});
        this.span(' column can contain any regular expression. The groups ');
        this.span('(path)', {class: 'text-highlight'});
        this.span(' and ');
        this.span('(line)', {class: 'text-highlight'});
        this.span(' are used to match file paths and line numbers respectively.');
        this.span(' The ');
        this.span('Path RegEx', {class: 'text-highlight'});
        this.span(' column is optional. If it is left out then the built-in expression will be used for the path, ');
        this.span('but a custom expression can be specified in case the built-in one isn\'t sufficient.');
        this.tag('p');
        return this.subview('tableView', new TableEditView(['Name', 'Expression', 'Path RegEx']));
      });
    });
  }

  initialize() {
    const {
      patterns
    } = this.config;

    if ((patterns == null)) {
      return;
    }

    return (() => {
      const result = [];
      for (let name in patterns) {
        const value = patterns[name];
        result.push(this.tableView.addRow([name, value.expression, value.path]));
      }
      return result;
    })();
  }

  persistChanges() {
    const patterns = {};
    const rows = this.tableView.getRows();

    for (let row of Array.from(rows)) {
      const name = row[0].trim();

      if (name.length > 0) {
        const pattern = {};
        pattern.expression = row[1].trim();

        const path = row[2].trim();
        if (path.length > 0) {
          pattern.path = path;
        }

        patterns[name] = pattern;
      }
    }

    return this.config.patterns = patterns;
  }
});
