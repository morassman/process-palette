/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')

export default class TabView extends View {

  constructor(closable, icon, label, content, initialize = true) {
    super(false)
    this.tabsView = null
    this.closable = closable
    this.icon = icon
    this.label = label ? label : ''
    this.closeElement = null
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
      this.iconElement.classList.add('process-palette-tabs-view-tab-icon')
      this.iconElement.classList.add('icon')
      this.iconElement.classList.add(`icon-${this.icon}`)
      // this.iconElement.style.paddingRight = '0.25em'
      this.element.appendChild(this.iconElement)
    }

    this.labelElement = document.createElement("span")
    // this.labelElement.innerHTML = `&nbsp;${this.label}&nbsp;`
    // this.labelElement.classList.add("process-palette-tabs-view-tab-label")
    this.element.appendChild(this.labelElement)

    if (this.closable) {
      this.closeElement = document.createElement("span")
      this.closeElement.classList.add('process-palette-tabs-view-tab-close')
      this.closeElement.classList.add('icon')
      this.closeElement.classList.add(`icon-x`)
      this.closeElement.onclick = (e) => {
        e.stopPropagation()
        this.close()
      }
      this.element.appendChild(this.closeElement)
    }

    this.applyLabel()
  }

  render() {
    return <div className="process-palette-tabs-view-tab" on={{ click: () => this.tabsView.selectTab(this) }} />
  }

  // Called when the tab was selected and its content is being shown.
  contentShown() {
  }

  close() {
    this.tabsView.removeTab(this)
  }

  setLabel(label) {
    this.label = label
    this.applyLabel()
  }

  applyLabel() {
    if (this.label) {
      this.labelElement.innerHTML = `&nbsp;${this.label}&nbsp;`
    } else {
      this.labelElement.innerHTML = ''
    }
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