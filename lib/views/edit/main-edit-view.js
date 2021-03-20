/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const {File, CompositeDisposable} = require('atom');
// const {$$, View} = require('atom-space-pen-views');
const View = require('../view')
const SplitView = require('../split-view');
const CommandChooseView = require('./command-choose-view');
const CommandEditView = require('./command-edit-view');
const PatternEditView = require('./pattern-edit-view');

export default class MainEditView extends View {

  constructor(main, title, filePath, config, selectedAction) {
    super()
    this.main = main;
    this.title = title;
    this.filePath = filePath;
    this.config = config;
    this.selectedAction = selectedAction;
    // super(this.title, this.filePath, this.config, this.selectedAction);
  }

  render() {
    return <div attributes={this.getAttributes()}>MainEditView</div>
  }

  update(props, children) {
    return etch.update(this)
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
    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.tooltips.add(this.toggleButton, {title: "Toggle panel"}));
    this.disposables.add(atom.tooltips.add(this.reloadButton, {title: "Apply and reload"}));
    this.disposables.add(atom.workspace.onWillDestroyPaneItem(e => this.willDestroy(e)));

    this.toggleButton.on('mousedown', e => e.preventDefault());
    this.reloadButton.on('mousedown', e => e.preventDefault());

    this.currentRightView = null;
    this.commandChooseView.setMainEditView(this);

    this.leftView.detach();
    this.rightView.detach();

    this.splitView.setLeftView(this.leftView);
    this.splitView.setRightView(this.rightView);

    this.editPatternsButton.on('mousedown', e => e.preventDefault());
    this.saved = JSON.stringify(this.config, null, '  ');

    if (this.selectedAction !== null) {
      return this.commandChooseView.selectCommandItemViewWithAction(this.selectedAction);
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
      return this.main.reloadConfiguration(false);
    }
  }

  togglePressed() {
    return this.main.togglePanel();
  }

  reloadPressed() {
    return this.main.reloadConfiguration();
  }

  editPatterns() {
    if (this.currentRightView instanceof PatternEditView) {
      return;
    }

    this.persistCurrentView();
    this.commandChooseView.commandItemViewSelected(null);

    const view = new PatternEditView(this.config);
    return this.setRightView(view);
  }

  commandItemViewSelected(itemView) {
    this.persistCurrentView();

    if (itemView === null) {
      return this.setRightView(this.rightView);
    } else {
      const view = new CommandEditView(this.config, itemView);
      return this.setRightView(view);
    }
  }

  setRightView(currentRightView) {
    this.currentRightView = currentRightView;
    return this.splitView.setRightView(this.currentRightView);
  }

  persistCurrentView() {
    if ((this.currentRightView != null ? this.currentRightView.persistChanges : undefined) != null) {
      return this.currentRightView.persistChanges();
    }
  }

  saveChanges() {
    this.persistCurrentView();
    return this.saveToFile(JSON.stringify(this.config, null, '  '));
  }

  saveToFile(text) {
    const file = new File(this.filePath);
    file.writeSync(text);
    return this.saved = text;
  }

  destroy() {
    return (this.disposables != null ? this.disposables.dispose() : undefined);
  }

}
