/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const HelpView = require('./help-view');
const MainButtonsView = require('./main-buttons-view')
const { CompositeDisposable } = require('atom');
const View = require('./view')
const { ConfigTabView, TabsView, TabView } = require('./tabs-view')

class ProjectListView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="process-palette-project-list-view" attributes={this.getAttributes()} />
  }

}

export default class MainView extends View {

  constructor(main) {
    super(false)
    this.main = main
    this.viewHeight = 200;
    this.outputView = null;
    this.projectListView = new ProjectListView()
    this.homeTab = new TabView(false, 'home', undefined, this.projectListView)
    this.mainButtonsView = new MainButtonsView({ mainView: this })

    this.initialize()

    this.showHelpView();
  }

  render() {
    return <div className="process-palette">
      <div className="process-palette-main-content">
        <HelpView ref="helpView" main={this.main} mainView={this} />
        <TabsView ref="tabsView" extra={this.mainButtonsView} />
      </div>
    </div>
  }

  initialize() {
    super.initialize()
    this.refs.tabsView.addTab(this.homeTab)
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

  setSaveButtonVisible(visible) {
    this.mainButtonsView.setSaveButtonVisible(visible)
  }

  showListView() {
    if (this.refs.tabsView.isHidden()) {
      this.hideHelpView();
      this.refs.tabsView.show()
      this.refs.tabsView.selectTab(this.homeTab)
    }
  }

  toggleHelpView() {
    if (this.refs.helpView.isHidden()) {
      this.showHelpView();
    } else {
      this.showListView();
    }
  }

  hideHelpView() {
    this.refs.helpView.hide();
  }

  showHelpView() {
    this.refs.tabsView.hide()
    this.refs.helpView.show();
  }

  showProcessOutput(processController) {
    let tab = this.refs.tabsView.getConfigTab(processController.configController)

    if (!tab) {
      tab = this.refs.tabsView.addConfigTab(processController.configController)
    }

    this.refs.tabsView.selectTab(tab)
    tab.showProcessOutput(processController)
    this.showListView()
  }

  isProcessOutputShown(processController) {
    const tab = this.refs.tabsView.getConfigTab(processController.configController)
    return tab ? tab.isProcessOutputShown(processController) : false
  }

  isHomeTabVisible() {
    if (this.refs.tabsView.isHidden()) {
      return false
    }

    return this.homeTab === this.refs.tabsView.selectedTab
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
    this.projectListView.append(view);
    this.showListView();
  }

  processControllerRemoved(processController) {
    const tab = this.refs.tabsView.getConfigTab(processController.configController)

    const nextProcessController = processController.configController.getFirstProcessController();

    // If there are no more left then remove the tab.
    if (!nextProcessController) {
      this.refs.tabsView.removeTab(tab)
      this.showListView();
    } else if (tab.isProcessOutputShown(processController)) {
      tab.showProcessOutput(nextProcessController);
    }
  }

  killFocusedProcess(discard) {
    if (this.refs.tabsView.isHidden()) {
      return
    }

    const tab = this.refs.tabsView.selectedTab

    if (tab instanceof ConfigTabView) {
      if (tab.currentProcessController) {
        tab.currentProcessController.killProcess(discard)
      }
    }
  }

  discardFocusedOutput() {
    if (this.refs.tabsView.isHidden()) {
      return
    }

    const tab = this.refs.tabsView.selectedTab

    if (tab instanceof ConfigTabView) {
      if (tab.currentProcessController) {
        tab.currentProcessController.discard()
      }
    }
  }

  destroy() {
    this.mainButtonsView.destroy()
    this.refs.helpView.destroy()
    this.refs.tabsView.destroy();
    etch.destroy(this);
  }

}
