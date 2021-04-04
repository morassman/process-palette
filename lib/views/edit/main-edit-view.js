/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { File, CompositeDisposable } = require('atom')
const View = require('../view')
const SplitView = require('../split-view')
const CommandChooseView = require('./command-choose-view')
const CommandEditView = require('./command-edit-view')
const PatternEditView = require('./pattern-edit-view')
const ProcessConfig = require('../../process-config')
const fsp = require('fs-plus')

class LeftView extends View {

  constructor(mainEditView, config) {
    super(false)
    this.mainEditView = mainEditView
    this.config = config
    this.initialize()
  }

  render() {
    return <div className="process-palette-main-edit-view-left-view">
      <div className="panel-body">
        <CommandChooseView ref="commandChooseView" config={this.config} mainEditView={this.mainEditView} />
      </div>
    </div>
  }

}

class RightView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="process-palette-main-edit-view-right-view">
      <ul className="background-message centered">
        <li>Choose to edit commands on the left or edit patterns above</li>
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
      <div className="process-palette-main-edit-view-top-bar">
        <div className="process-palette-main-edit-view-top-bar-info">
          <h1 className="process-palette-main-edit-view-top-bar-info-title">{this.title}</h1>
          <span className="process-palette-main-edit-view-top-bar-info-path">{this.filePath}</span>
        </div>

        <div className="btn-toolbar">
          <button className="btn" on={{ click: () => this.editPatterns(), mousedown: e => e.preventDefault() }}>Edit Patterns</button>
          <button className="btn" on={{ click: () => this.togglePanel(), mousedown: e => e.preventDefault() }}>Toggle Process Panel</button>
          <button className="btn btn-primary" on={{ click: () => this.save(false), mousedown: e => e.preventDefault() }}>Save</button>
          <button className="btn btn-primary" on={{ click: () => this.save(true), mousedown: e => e.preventDefault() }}>Save and Close</button>
          <button className="btn btn-warning" on={{ click: () => this.delete(), mousedown: e => e.preventDefault() }}>Delete</button>
          <button className="btn" on={{ click: () => this.close(), mousedown: e => e.preventDefault() }}>Cancel</button>
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

    this.leftView = new LeftView(this, this.config)
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
        pane.destroyItem(this.paneItem).catch()
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
    options.buttons = ["Save", "Don't Save", "Cancel"];

    const choice = atom.confirm(options);

    if (choice === 0) {
      this.saveToFile(memory);
      this.main.reloadConfiguration(false);
    } else if (choice === 2) {
      // Prevent the pane from being destroyed.
      return new Promise(() => { }, () => { })
    }
  }

  togglePanel() {
    this.main.togglePanel();
  }

  save(close) {
    this.saveChanges()
    this.main.reloadConfiguration();

    if (close) {
      this.close()
    }
  }

  delete() {
    atom.confirm({
      message: "Are you sure you want to delete this configuration file?",
      buttons: {
        "Cancel": () => { },
        "Delete": () => this.deleteConfirmed()
      }
    })
  }

  deleteConfirmed() {
    fsp.removeSync(this.filePath)
    this.main.reloadConfiguration()
    this.close()
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
