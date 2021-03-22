/** @babel */

const { Directory } = require('atom')
const { SelectListView } = require('atom-space-pen-views')

// This view is used as a modal for selecting one of the projects that are open in Atom.
export default class ProjectSelectView extends SelectListView {

  constructor(callback, path) {
    super()
    this.callback = callback
    if (path == null) { path = true }
    this.path = path

  }

  initialize() {
    super.initialize()

    this.addClass('overlay from-top')
    const items = this.refreshItems()

    if (items.length === 0) {
      return
    }

    if (items.length === 1) {
      this.openItem(items[0])
      return
    }

    this.setItems(items)

    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({ item: this })
    }

    this.panel.show()
    this.focusFilterEditor()
  }

  refreshItems() {
    const items = []

    for (let projectPath of atom.project.getPaths()) {
      const dir = new Directory(projectPath)
      const item = {}
      item.name = dir.getBaseName()
      item.path = projectPath
      items.push(item)
    }

    return items
  }

  getFilterKey() {
    return "name"
  }

  viewForItem(item) {
    return `\
      <li class='two-lines'>
      <div class='primary-line'>${item.name}</div>
      <div class='secondary-line'>${item.path}</div>
      </li>`
  }

  openItem(item) {
    if ((item == null)) {
      return this.callback(null)
    } else if (this.path) {
      return this.callback(item.path)
    } else {
      return this.callback(item.name)
    }
  }

  confirmed(item) {
    this.hide()
    if (this.panel != null) {
      this.panel.destroy()
    }
    return this.openItem(item)
  }

  cancelled() {
    this.hide()
    return (this.panel != null ? this.panel.destroy() : undefined)
  }

}
