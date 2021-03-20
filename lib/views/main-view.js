/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const HelpView = require('./help-view');
// const ProjectView = require('./project-view');
const { CompositeDisposable } = require('atom');
const View = require('./view')

class OutputViewContainer extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="output-view" attributes={this.getAttributes()} ref="outputViewContainer">OutputViewContainer</div>
  }

}

class ListView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="project-list" attributes={this.getAttributes()} ref="listView" />
  }

}

class HelpParentView extends View {

  constructor({ main }) {
    super(false)
    this.main = main
    this.initialize()
  }

  render() {
    return <div className="helpView" attributes={this.getAttributes()} ref="helpView"><HelpView ref="hv" main={this.main} /></div>
  }

  update(props, children) {
    return etch.update(this)
  }

  destroy() {
    super.destroy()
    this.refs.hv.destroy()
  }

}

export default class MainView {

  constructor(main) {
    this.main = main
    this.viewHeight = 200;
    this.outputView = null;
    this.disposables = new CompositeDisposable();

    etch.initialize(this)

    this.showHelpView();
  }

  render() {
    return <div className="process-palette">
      <div className="button-group">
        <button className="btn btn-sm btn-fw btn-info inline-block-tight" ref="saveButton" on={{ click: this.savePressed }}>Save</button>
        <button className="btn btn-sm btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: this.editPressed }} />
        <button className="btn btn-sm btn-fw icon-sync inline-block-tight" ref="reloadButton" on={{ click: this.reloadPressed }} />
        <button className="btn btn-sm btn-fw icon-gear inline-block-tight" ref="settingsButton" on={{ click: this.settingsPressed }} />
        <button className="btn btn-sm btn-fw icon-question inline-block-tight" ref="helpButton" on={{ click: this.toggleHelpView }} />
        <button className="btn btn-sm btn-fw icon-chevron-down inline-block-tight" ref="hideButton" on={{ click: this.closePressed }} />
      </div>
      <div className="main-content">
        <HelpParentView ref="helpView" main={this.main} />
        <ListView ref="listView" />
        <OutputViewContainer ref="outputViewContainer" />
      </div>
    </div>
  }

  update(props, children) {
    return etch.update(this)
  }

  writeAfterUpdate() {
  }

  // static content(main) {
  //   return this.div({ class: "process-palette" }, () => {
  //     this.div({ class: "button-group" }, () => {
  //       this.button("Save", { class: "btn btn-sm btn-fw btn-info inline-block-tight", outlet: "saveButton", click: "savePressed" });
  //       this.button({ class: "btn btn-sm btn-fw icon-pencil inline-block-tight", outlet: "editButton", click: "editPressed" });
  //       this.button({ class: "btn btn-sm btn-fw icon-sync inline-block-tight", outlet: "reloadButton", click: "reloadPressed" });
  //       this.button({ class: "btn btn-sm btn-fw icon-gear inline-block-tight", outlet: "settingsButton", click: "settingsPressed" });
  //       this.button({ class: "btn btn-sm btn-fw icon-question inline-block-tight", outlet: "helpButton", click: "toggleHelpView" });
  //       return this.button({ class: "btn btn-sm btn-fw icon-chevron-down inline-block-tight", outlet: "hideButton", click: "closePressed" });
  //     });
  //     return this.div({ class: "main-content", outlet: "mainContent" }, () => {
  //       this.div({ outlet: "helpView" }, () => {
  //         return this.subview("hv", new HelpView(main));
  //       });
  //       this.div({ class: "projects-list", outlet: "listView" });
  //       return this.div({ class: "output-view", outlet: "outputViewContainer" });
  //     });
  //   });
  // }

  // initialize() {
  //   this.disposables = new CompositeDisposable();
  //   this.disposables.add(atom.tooltips.add(this.saveButton, { title: "Save changes" }));
  //   this.disposables.add(atom.tooltips.add(this.helpButton, { title: "Toggle help" }));
  //   this.disposables.add(atom.tooltips.add(this.editButton, { title: "Edit configuration" }));
  //   this.disposables.add(atom.tooltips.add(this.reloadButton, { title: "Reload configurations" }));
  //   this.disposables.add(atom.tooltips.add(this.settingsButton, { title: "Settings" }));
  //   this.disposables.add(atom.tooltips.add(this.hideButton, { title: "Hide" }));

  //   this.saveButton.on('mousedown', e => e.preventDefault());
  //   this.editButton.on('mousedown', e => e.preventDefault());
  //   this.reloadButton.on('mousedown', e => e.preventDefault());
  //   this.settingsButton.on('mousedown', e => e.preventDefault());
  //   this.helpButton.on('mousedown', e => e.preventDefault());
  //   this.hideButton.on('mousedown', e => e.preventDefault());

  //   return this.saveButton.hide();
  // }

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
    if (visible) {
      this.refs.saveButton.setAttribute('visibility', 'visible')
    } else {
      this.refs.saveButton.setAttribute('visibility', 'hidden')
    }
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
      this.outputView.detach();
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

    this.outputView.detach();
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
