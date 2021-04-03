/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')
const ConfigTabView = require('./config-tab-view')
const TerminalTabView = require('./terminal-tab-view')

export default class TabsView extends View {

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

  addTab(tab, select = false) {
    tab.setTabsView(this)
    this.tabs.push(tab)
    this.refs.tabs.appendChild(tab.element)

    // If this is the first tab then select it.
    if (select || this.tabs.length === 1) {
      this.selectTab(tab)
    }
  }

  removeTab(tab) {
    this.tabs = this.tabs.filter(t => t !== tab)

    if (this.refs.tabs.contains(tab.element)) {
      this.refs.tabs.removeChild(tab.element)
    }

    if (this.selectedTab === tab) {
      this.selectTab(this.tabs.length > 0 ? this.tabs[0] : null)
    }

    tab.destroy()
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
      this.selectedTab.contentShown()
    } else {
      this.setContent(this.emptyContent)
    }
  }

  getTabWithContent(content) {
    return this.tabs.find(tab => tab.content === content)
  }

}