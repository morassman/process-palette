/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { File, CompositeDisposable } = require('atom');
const View = require('../view')
const SplitView = require('../split-view');
const CommandChooseView = require('./command-choose-view');
const CommandEditView = require('./command-edit-view');
const PatternEditView = require('./pattern-edit-view');

class LeftView extends View {

  constructor(mainEditView, title, config, toggle, reload, editPatterns) {
    super(false)
    this.mainEditView = mainEditView
    this.title = title
    this.config = config
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
        <CommandChooseView ref="commandChooseView" commands={this.config.commands} />
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
    this.config = config;
    this.selectedAction = selectedAction;
    this.currentRightView = null;
    this.disposables = new CompositeDisposable();
    this.initialize()
  }

  render() {
    return <div attributes={this.getAttributes()}>
      <div className="main-edit-view">
        <SplitView ref="splitView" />
      </div>
    </div>
  }

  static content(title, filePath, config) {
    return this.div(() => {
      return this.div({class: 'main-edit-view'}, () => {
        this.subview('splitView', new SplitView());
        this.div({class: 'left-view', outlet: 'leftView'}, () => {
          this.span(title, {class: 'title text-highlight'});
          this.button({class:"btn btn-sm icon-unfold inline-block-tight reload-button", outlet: "toggleButton", click: "togglePressed"});
          this.button({class:"btn btn-sm icon-sync inline-block-tight reload-button", outlet: "reloadButton", click: "reloadPressed"});
          this.div({class: 'panel-body'}, () => {
            return this.subview('commandChooseView', new CommandChooseView(config.commands));
          });
          return this.button('Edit Patterns', {class: 'btn btn-sm edit-patterns-button', outlet: 'editPatternsButton', click: 'editPatterns'});
      });
        return this.div({class: 'right-view', outlet: 'rightView'}, () => {
          return this.ul({class: 'background-message centered'}, () => {
            return this.li('Choose to edit commands or patterns on the left');
          });
        });
      });
    });
  }

  getTitle() {
    return 'process-palette.json';
  }

  initialize() {
    super.initialize()

    this.disposables.add(atom.workspace.onWillDestroyPaneItem(e => this.willDestroy(e)));

    // TODO
    // this.commandChooseView.setMainEditView(this);

    this.leftView = new LeftView(this, this.title, this.config, () => this.togglePressed(), () => this.reloadPressed(), () => this.editPatterns())
    this.rightView = new RightView()

    this.refs.splitView.setLeftView(this.leftView);
    this.refs.splitView.setRightView(this.rightView);

    this.saved = JSON.stringify(this.config, null, '  ');

    // TODO
    // if (this.selectedAction !== null) {
    //   this.commandChooseView.selectCommandItemViewWithAction(this.selectedAction);
    // }
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
    if ((this.currentRightView != null ? this.currentRightView.persistChanges : undefined) != null) {
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
