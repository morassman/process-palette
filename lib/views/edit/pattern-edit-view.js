/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')
const TableEditView = require('./table-edit-view');

export default class PatternEditView extends View {

  constructor(config) {
    super(false)
    this.config = config;
    this.initialize()
  }

  render() {
    return <div className="process-palette-pattern-edit-view">
      <div className="header"><h1>Edit Patterns</h1></div>
      <p>
        <span>Patterns are used to detect file paths and line numbers when the output is shown in the </span>
        <span className="text-highlight">panel</span>
        <span> target. Each command can have its own patterns configured for it.</span>
      </p>
      <p>
        <span>The </span>
        <span className="text-highlight">Expression</span>
        <span> column can contain any regular expression. The groups </span>
        <span className="text-highlight">(path)</span>
        <span> and </span>
        <span className="text-highlight">(line)</span>
        <span> are used to match file paths and line numbers respectively.</span>
      </p>
      <p>
        <span> The </span>
        <span className="text-highlight">Path RegEx</span>
        <span> column is optional. If it is left out then the built-in expressions will be used for the path, </span>
        <span>but a custom expression can be specified in case the built-in one is not sufficient.</span>
      </p>
      <TableEditView ref="tableView" columns={['Name', 'Expression', 'Path RegEx']} />
    </div>
  }

  static content() {
    return this.div(() => {
      return this.div({ class: 'process-palette-pattern-edit-view' }, () => {
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
    super.initialize()
    const { patterns } = this.config;

    if (!patterns) {
      return;
    }

    Object.keys(patterns).forEach(name => {
      const value = patterns[name]
      this.refs.tableView.addRow([name, value.expression, value.path])
    })
  }

  persistChanges() {
    const patterns = {};
    const rows = this.refs.tableView.getRows();

    for (let row of rows) {
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

}
