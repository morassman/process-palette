/** @babel */

const { Directory } = require('atom')
const SelectList = require('atom-select-list')

export default function showProjectSelectModal(callback, path) {
  const items = getItems()

  if (items.length === 0) {
    openItem(null, callback)
    return
  }

  if (items.length === 1) {
    openItem(items[0], callback)
    return
  }

  const view = new ProjectSelectModal(items, callback, path)
  view.open()
}

function getItems() {
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

function openItem(item, callback) {
  if (!item) {
    callback(null)
  } else if (item.path) {
    callback(item.path)
  } else {
    callback(item.name)
  }
}


function elementForItem(item, options) {
  const li = document.createElement('li')

  if (!options.visible) {
    return li
  }

  const primary = document.createElement('div')
  primary.classList.add('primary-line')
  primary.textContent = item.name

  const secondary = document.createElement('div')
  secondary.classList.add('secondary-line')
  secondary.textContent = item.path

  li.classList.add('event', 'two-lines')
  li.appendChild(primary)
  li.appendChild(secondary)

  return li
}

// This view is used as a modal for selecting one of the projects that are open in Atom.
class ProjectSelectModal {

  constructor(items, callback, path = true) {
    this.items = items
    this.callback = callback
    this.path = path

    this.selectList = new SelectList({
      items,
      elementForItem,
      filterKeyForItem: item => item.name,
      didConfirmSelection: item => {
        this.close()
        openItem(item, callback)
      },
      didConfirmEmptySelection: () => {
        this.close()
      },
      didCancelSelection: () => {
        this.close()
      }
    })
  }

  open() {
    this.panel = atom.workspace.addModalPanel({ item: this.selectList, visible: true, autoFocus: true })
    const input = this.selectList.element.querySelector("input")

    if (input) {
      input.focus()
    }
  }

  close() {
    if (this.panel) {
      this.panel.destroy()
    }
  }

}
