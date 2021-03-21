/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { File, CompositeDisposable } = require('atom');
const View = require('../view')
const SplitView = require('../split-view');
const CommandChooseView = require('./command-choose-view');
const CommandEditView = require('./command-edit-view');
const PatternEditView = require('./pattern-edit-view');
const ProcessConfig = require('../../process-config')

class LeftView extends View {

  constructor(mainEditView, title, config, selectedAction, toggle, reload, editPatterns) {
    super(false)
    this.mainEditView = mainEditView
    this.title = title
    this.config = config
    this.selectedAction = selectedAction
    this.toggle = toggle
    this.reload = reload
    this.editPatterns = editPatterns
    this.disposables = new CompositeDisposable();
    this.initialize()
  }

  initialize() {
    super.initialize()
    this.disposables.add(atom.tooltips.add(this.refs.toggleButton, { title: "Toggle panel" }));
    this.disposables.add(atom.tooltips.add(this.refs.reloadButton, { title: "Apply and reload" }));
    this.refs.commandChooseView.setMainEditView(this.mainEditView)
  }

  render() {
    return <div className="left-view">
      <span className="title text-highlight">{this.title}</span>
      <button ref="toggleButton" className="btn btn-sm icon-unfold inline-block-tight reload-button" on={{ click: this.toggle, mousedown: e => e.preventDefault() }} />
      <button ref="reloadButton" className="btn btn-sm icon-sync inline-block-tight reload-button" on={{ click: this.reload, mousedown: e => e.preventDefault() }} />
      <div className="panel-body">
        <CommandChooseView ref="commandChooseView" config={this.config} />
      </div>
      <button ref="editPatternsButton" className="btn btn-sm edit-patterns-button" on={{ click: this.editPatterns, mousedown: e => e.preventDefault() }}>Edit Patterns</button>
    </div>
  }

  destroy() {
    this.disposables.dispose()
    super.destroy()
  }

}

class RightView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="right-view">
      <ul className="background-message centered">
        <li>Choose to edit commands or patterns on the left</li>
      </ul>
    </div>
  }
}

export default class MainEditView extends View {

  constructor(main, title, filePath, config, selectedAction) {
    super(false)
    this.main = main;
    this.title = title;
    this.filePath = filePath;
    this.config = { ...config }
    this.config.commands = this.config.commands.map(command => new ProcessConfig(command))
    this.selectedAction = selectedAction;
    this.currentRightView = null;
    this.disposables = new CompositeDisposable();
    this.initialize()
  }

  render() {
    return <div attributes={this.getAttributes()}>
      <div className="process-palette-main-edit-view">
        <SplitView ref="splitView" />
      </div>
    </div>
  }

  getTitle() {
    return 'process-palette.json';
  }

  initialize() {
    super.initialize()

    this.disposables.add(atom.workspace.onWillDestroyPaneItem(e => this.willDestroy(e)));

    this.leftView = new LeftView(this, this.title, this.config, this.selectedAction, () => this.togglePressed(), () => this.reloadPressed(), () => this.editPatterns())
    this.rightView = new RightView()

    this.refs.splitView.setLeftView(this.leftView);
    this.refs.splitView.setRightView(this.rightView);

    this.saved = JSON.stringify(this.config, null, '  ');

    if (this.selectedAction) {
      this.leftView.refs.commandChooseView.selectCommandItemViewWithAction(this.selectedAction)
    }
  }

  willDestroy(e) {
    if (e.item !== this) {
      return;
    }

    this.persistCurrentView();
    const memory = JSON.stringify(this.config, null, '  ');

    if (memory === this.saved) {
      return;
    }

    const options = {};
    options.message = 'Configuration changed';
    options.detailedMessage = 'Save and apply new configuration?';
    options.buttons = ['Yes', 'No'];

    const choice = atom.confirm(options);

    if (choice === 0) {
      this.saveToFile(memory);
      this.main.reloadConfiguration(false);
    }
  }

  togglePressed() {
    this.main.togglePanel();
  }

  reloadPressed() {
    this.main.reloadConfiguration();
  }

  editPatterns() {
    if (this.currentRightView instanceof PatternEditView) {
      return;
    }

    this.persistCurrentView();
    this.commandChooseView.commandItemViewSelected(null);

    const view = new PatternEditView(this.config);
    this.setRightView(view);
  }

  commandItemViewSelected(itemView) {
    this.persistCurrentView();

    if (itemView) {
      this.setRightView(new CommandEditView(this.config, itemView));
    } else {
      this.setRightView(this.rightView);
    }
  }

  setRightView(currentRightView) {
    this.currentRightView = currentRightView;
    this.refs.splitView.setRightView(this.currentRightView);
  }

  persistCurrentView() {
    if (this.currentRightView && this.currentRightView.persistChanges) {
      this.currentRightView.persistChanges();
    }
  }

  saveChanges() {
    this.persistCurrentView();
    this.saveToFile(JSON.stringify(this.config, null, '  '));
  }

  saveToFile(text) {
    const file = new File(this.filePath);
    file.writeSync(text);
    this.saved = text;
  }

  destroy() {
    this.leftView.destroy()
    this.rightView.destroy()
    this.disposables.dispose()
    super.destroy()
  }

}
