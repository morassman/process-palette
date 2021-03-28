/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable } = require('atom')
const View = require('./view')
const _ = require('underscore-plus')

export class TabView extends View {

  constructor(closable, icon, label, content, initialize = true) {
    super(false)
    this.tabsView = null
    this.closable = closable
    this.icon = icon
    this.label = label
    this.iconElement = null
    this.labelElement = null
    this.content = content

    if (initialize) {
      this.initialize()
    }
  }

  initialize() {
    super.initialize()

    if (this.icon) {
      this.iconElement = document.createElement("span")
      this.iconElement.classList.add('icon')
      this.iconElement.classList.add(`icon-${this.icon}`)
      this.element.appendChild(this.iconElement)
    }

    this.labelElement = document.createElement("span")
    this.labelElement.textContent = this.label
    this.element.appendChild(this.labelElement)
  }

  render() {
    return <div className="process-palette-tabs-view-tab" on={{ click: () => this.tabsView.selectTab(this) }} />
  }

  setLabel(label) {
    this.label = label
    this.labelElement.textContent = label
  }

  setTabsView(tabsView) {
    this.tabsView = tabsView
  }

  setSelected(selected) {
    if (selected) {
      this.element.classList.add("process-palette-tabs-view-tab-selected")
    } else {
      this.element.classList.remove("process-palette-tabs-view-tab-selected")
    }
  }

  destroy() {
    if (this.content) {
      this.content.destroy()
    }

    super.destroy()
  }

}

class ConfigTabContentView extends View {

  constructor() {
    super(true)
    this.processController = null
  }

  showProcessOutput(processController) {
    if (this.processController && this.element.contains(this.processController.outputView.element)) {
      this.element.removeChild(this.processController.outputView.element)
    }

    this.processController = processController

    if (this.processController) {
      this.element.appendChild(this.processController.outputView.element)
    }
  }

  render() {
    return <div className="process-palette-config-tab-view" attributes={this.getAttributes()} />
  }

}

export class ConfigTabView extends TabView {

  constructor(configController) {
    super(false, null, '', new ConfigTabContentView(), false)
    this.configController = configController
    this.currentProcessController = null
    this.disposables = new CompositeDisposable();

    this.initialize()

    // Show the first process by default.
    if (configController.processControllers.length > 0) {
      this.showProcessOutput(configController.processControllers[0])
    }

    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showNamespaceInTabs', () => this.refreshLabel()))
    this.refreshLabel()
  }

  refreshLabel() {
    const showNamespace = atom.config.get('process-palette.palettePanel.showNamespaceInTabs')
    this.setLabel(this.configController.config.getHumanizedCommandName(showNamespace))
  }

  showProcessOutput(processController) {
    this.currentProcessController = processController
    this.content.showProcessOutput(processController)
  }

  isProcessOutputShown(processController) {
    return this.currentProcessController === processController
  }

  destroy() {
    this.disposables.dispose()
    super.destroy()
  }

}

export class TabsView extends View {

  constructor({ extra }) {
    super(false)
    this.extra = extra
    this.tabs = []
    this.selectedTab = null
    this.initialize()
  }

  initialize() {
    super.initialize()
    this.refs.header.appendChild(this.extra.element)
  }

  render() {
    return <div className="process-palette-tabs-view" attributes={this.getAttributes()}>
      <div ref="header" className="process-palette-tabs-view-header">
        <div ref="tabs" className="process-palette-tabs-view-list" on={{ wheel: e => this.onListWheel(e) }} />
      </div>
      <div ref="content" className="process-palette-tabs-view-content" />
    </div>
  }

  onListWheel(e) {
    this.refs.tabs.scrollLeft += (e.deltaY / 2)
  }

  setContent(content) {
    while (this.refs.content.firstChild) {
      this.refs.content.removeChild(this.refs.content.firstChild)
    }

    if (content) {
      this.refs.content.appendChild(content)
    }
  }

  renderTab(tab) {
    return <div className="process-palette-tabs-view-tab">Tab
    </div>
  }

  addTab(tab) {
    tab.setTabsView(this)
    this.tabs.push(tab)
    this.refs.tabs.appendChild(tab.element)

    // If this is the first tab then select it.
    if (this.tabs.length === 1) {
      this.selectTab(tab)
    }
  }

  removeTab(tab) {
    this.tabs = this.tabs.filter(t => t !== tab)
    this.refs.tabs.removeChild(tab.element)

    if (this.selectedTab === tab) {
      this.selectTab(this.tabs.length > 0 ? this.tabs[0] : null)
    }

    tab.destroy()
  }

  addConfigTab(configController) {
    const tab = new ConfigTabView(configController)
    this.addTab(tab)
    return tab
  }

  getConfigTab(configController) {
    return this.tabs.find(tab => tab instanceof ConfigTabView && tab.configController === configController)
  }

  selectTab(tab) {
    if (this.selectedTab === tab) {
      return
    }

    if (this.selectedTab) {
      this.selectedTab.setSelected(false)
    }

    this.selectedTab = tab

    if (this.selectedTab) {
      this.selectedTab.setSelected(true)
      this.selectedTab.element.scrollIntoView()
      this.setContent(this.selectedTab.content.element)
    } else {
      this.setContent(this.emptyContent)
    }
  }

  getTabWithContent(content) {
    return this.tabs.find(tab => tab.content === content)
  }

}