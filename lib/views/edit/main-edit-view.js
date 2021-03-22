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

  constructor(mainEditView, config, editPatterns) {
    super(false)
    this.mainEditView = mainEditView
    this.config = config
    this.editPatterns = editPatterns
    this.initialize()
  }

  render() {
    return <div className="left-view">
      <div className="panel-body">
        <CommandChooseView ref="commandChooseView" config={this.config} mainEditView={this.mainEditView} />
      </div>
      <button ref="editPatternsButton" className="btn btn-sm edit-patterns-button" on={{ click: this.editPatterns, mousedown: e => e.preventDefault() }}>Edit Patterns</button>
    </div>
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
    this.paneItem = null
    this.saved = JSON.stringify(this.config, null, '  ')
    this.disposables.add(atom.workspace.onWillDestroyPaneItem(e => this.willDestroy(e)));

    this.initialize()
  }

  render() {
    return <div className="process-palette-main-edit-view">
      <div className="top-bar">
        <div className="info">
          <h1 className="title">{this.title}</h1>
          <span className="file-path">{this.filePath}</span>
        </div>

        <div className="btn-toolbar">
          <button className="btn btn-primary" on={{ click: () => this.save(false), mousedown: e => e.preventDefault() }}>Save</button>
          <button className="btn btn-primary" on={{ click: () => this.save(true), mousedown: e => e.preventDefault() }}>Save and Close</button>
          <button className="btn" on={{ click: this.togglePressed, mousedown: e => e.preventDefault() }}>Toggle Panel</button>
          <button className="btn" on={{ click: this.close, mousedown: e => e.preventDefault() }}>Cancel</button>
        </div>
      </div>
      <SplitView ref="splitView" />
    </div>
  }

  getTitle() {
    return 'process-palette.json';
  }

  initialize() {
    super.initialize()

    this.leftView = new LeftView(this, this.config, () => this.editPatterns())
    this.rightView = new RightView()

    this.refs.splitView.setLeftView(this.leftView);
    this.refs.splitView.setRightView(this.rightView);

    if (this.selectedAction) {
      this.leftView.refs.commandChooseView.selectCommandItemViewWithAction(this.selectedAction)
    }
  }

  addPaneItem() {
    const pane = atom.workspace.getCenter().getActivePane()
    this.paneItem = pane.addItem(this, { index: 0 })
    pane.activateItem(this.paneItem)
  }

  close() {
    if (this.paneItem) {
      const pane = atom.workspace.paneForItem(this.paneItem)

      if (pane) {
        pane.destroyItem(this.paneItem)
      }
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

  save(close) {
    this.saveChanges()
    this.main.reloadConfiguration();

    if (close) {
      this.close()
    }
  }

  editPatterns() {
    if (this.currentRightView instanceof PatternEditView) {
      return;
    }

    this.persistCurrentView();
    this.leftView.refs.commandChooseView.commandItemViewSelected(null);

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
