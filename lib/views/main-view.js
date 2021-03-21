/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const HelpView = require('./help-view');
const { CompositeDisposable } = require('atom');
const View = require('./view')

class OutputViewContainer extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="output-view-container" attributes={this.getAttributes()} />
  }

}

class ListView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div attributes={this.getAttributes()} />
  }

}

export default class MainView extends View {

  constructor(main) {
    super(false)
    this.main = main
    this.viewHeight = 200;
    this.outputView = null;
    this.disposables = new CompositeDisposable();

    this.initialize()

    this.showHelpView();
  }

  render() {
    return <div className="process-palette">
      <div className="button-group">
        <button className="btn btn-sm btn-fw btn-info inline-block-tight" ref="saveButton" on={{ click: this.savePressed, mousedown: e => e.preventDefault() }}>Save</button>
        <button className="btn btn-sm btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: this.editPressed, mousedown: e => e.preventDefault() }} />
        <button className="btn btn-sm btn-fw icon-sync inline-block-tight" ref="reloadButton" on={{ click: this.reloadPressed, mousedown: e => e.preventDefault() }} />
        <button className="btn btn-sm btn-fw icon-gear inline-block-tight" ref="settingsButton" on={{ click: this.settingsPressed, mousedown: e => e.preventDefault() }} />
        <button className="btn btn-sm btn-fw icon-question inline-block-tight" ref="helpButton" on={{ click: this.toggleHelpView, mousedown: e => e.preventDefault() }} />
        <button className="btn btn-sm btn-fw icon-chevron-down inline-block-tight" ref="hideButton" on={{ click: this.closePressed, mousedown: e => e.preventDefault() }} />
      </div>
      <div className="main-content">
        <HelpView ref="helpView" main={this.main} />
        <ListView ref="listView" />
        <OutputViewContainer ref="outputViewContainer" />
      </div>
    </div>
  }

  initialize() {
    super.initialize()

    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.tooltips.add(this.refs.saveButton, { title: "Save changes" }));
    this.disposables.add(atom.tooltips.add(this.refs.helpButton, { title: "Toggle help" }));
    this.disposables.add(atom.tooltips.add(this.refs.editButton, { title: "Edit configuration" }));
    this.disposables.add(atom.tooltips.add(this.refs.reloadButton, { title: "Reload configurations" }));
    this.disposables.add(atom.tooltips.add(this.refs.settingsButton, { title: "Settings" }));
    this.disposables.add(atom.tooltips.add(this.refs.hideButton, { title: "Hide" }));

    this.refs.saveButton.style.visibility = 'hidden'
  }

  getTitle() {
    return 'Process Palette';
  }

  getURI() {
    return MainView.URI;
  }

  getPreferredLocation() {
    return 'bottom';
  }

  getAllowedLocations() {
    return ['bottom', 'left', 'right'];
  }

  isPermanentDockItem() {
    return false;
  }

  // setViewHeight(viewHeight) {
  //   this.viewHeight = viewHeight;
  // }

  setSaveButtonVisible(visible) {
    this.refs.saveButton.style.visibility = visible ? 'visible' : 'hidden'
  }

  showListView() {
    if (this.refs.listView.isHidden()) {
      this.hideHelpView();
      this.refs.outputViewContainer.hide();
      this.refs.listView.show();
    }
  }

  showOutputView() {
    if (this.refs.outputViewContainer.isHidden()) {
      this.hideHelpView();
      this.refs.listView.hide();
      this.refs.outputViewContainer.show();
    }
  }

  toggleHelpView() {
    if (this.refs.helpView.isHidden()) {
      return this.showHelpView();
    } else {
      return this.showListView();
    }
  }

  hideHelpView() {
    this.refs.helpView.hide();
    this.refs.helpButton.classList.remove("btn-info")
  }

  showHelpView() {
    this.refs.listView.hide();
    this.refs.outputViewContainer.hide();
    this.refs.helpView.show();

    if (!this.refs.helpButton.classList.contains("btn-info")) {
      return this.refs.helpButton.classList.add("btn-info");
    }
  }

  showProcessOutput(processController) {
    if (this.outputView !== null) {
      this.outputView.remove();
    }

    this.outputView = processController.outputView;
    this.refs.outputViewContainer.append(this.outputView);
    return this.showOutputView();
  }

  isProcessOutputShown(processController) {
    if (!this.isOutputViewVisible()) {
      return false;
    }

    if (this.outputView === null) {
      return false;
    }

    return this.outputView === processController.outputView;
  }

  isOutputViewVisible() {
    return this.refs.outputViewContainer.isVisible();
  }

  savePressed() {
    this.main.savePanel();
  }

  editPressed() {
    this.main.editConfiguration(true);
  }

  reloadPressed() {
    this.main.reloadConfiguration();
  }

  settingsPressed() {
    atom.workspace.open('atom://config/packages/process-palette');
  }

  closePressed() {
    this.main.hidePanel();
  }

  addProjectView(view) {
    this.refs.listView.append(view);
    this.showListView();
  }

  // Used?
  // addConfigController(configController) {
  //   this.listView.addConfigController(configController);
  //   return this.showListView();
  // }

  // Used?
  // removeConfigController(configController) {
  //   return this.listView.removeConfigController(configController);
  // }

  processControllerRemoved(processController) {
    if (this.outputView === null) {
      return;
    }

    if (this.outputView.processController !== processController) {
      return;
    }

    this.outputView.remove();
    this.outputView = null;

    processController = processController.configController.getFirstProcessController();

    if (this.refs.outputViewContainer.isVisible() && (processController !== null)) {
      this.showProcessOutput(processController);
    } else {
      this.showListView();
    }
  }

  killFocusedProcess(discard) {
    if (!this.outputViewContainer.isHidden()) {
      return (this.outputView != null ? this.outputView.processController.killProcess(discard) : undefined);
    }
  }

  discardFocusedOutput() {
    if (!this.outputViewContainer.isHidden()) {
      return (this.outputView != null ? this.outputView.processController.discard() : undefined);
    }
  }

  destroy() {
    this.helpView.destroy();
    this.disposables.dispose();
    // return this.element.remove();
    etch.destroy(this);
  }

  // getElement() {
  //   return this.element;
  // }
}
