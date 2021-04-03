/** @babel */

const SelectList = require('atom-select-list')

/**
 * 
 * @param {*} callback Function to call when a variable is chosen. The name of the variable
 * is passed if one is chosen, otherwise null.
 * @param {*} vars List of variables names to show.
 */
export default function showChooseVariableModal(callback, vars) {
  const items = getItems(vars)
  const view = new ChooseVariableModal(callback, items)
  view.open()
}

function getItems(vars) {
  const items = []

  items.push({ name: 'stdout', description: 'Standard output produced by the process.' })
  items.push({ name: 'stderr', description: 'Standard error output produced by the process.' })
  items.push({ name: 'exitStatus', description: 'Exit status code returned by the process.' })
  items.push({ name: 'fileExt', description: 'Extension of file.' })
  items.push({ name: 'fileName', description: 'Name of file without extension.' })
  items.push({ name: 'fileNameExt', description: 'Name of file with extension.' })
  items.push({ name: 'filePath', description: 'Path of file relative to project.' })
  items.push({ name: 'fileDirPath', description: 'Path of file\'s directory relative to project.' })
  items.push({ name: 'fileAbsPath', description: 'Absolute path of file.' })
  items.push({ name: 'fileDirAbsPath', description: 'Absolute path of file\'s directory.' })
  items.push({ name: 'fileProjectPath', description: 'Absolute path of file\'s project folder.' })
  items.push({ name: 'text', description: 'The full contents of the editor.' })
  items.push({ name: 'clipboard', description: 'Text currently on clipboard.' })
  items.push({ name: 'selection', description: 'Currently selected text.' })
  items.push({ name: 'word', description: 'Word under cursor.' })
  items.push({ name: 'token', description: 'Token under cursor.' })
  items.push({ name: 'line', description: 'Line at cursor.' })
  items.push({ name: 'lineNo', description: 'Line number at cursor.' })
  items.push({ name: 'fullCommand', description: 'The full command along with its arguments.' })
  items.push({ name: 'projectPath', description: 'Path of the first project\'s folder.' })
  items.push({ name: 'selectProjectPath', description: 'Prompts to choose the path of one of the projects in the workspace.' })
  items.push({ name: 'configDirAbsPath', description: 'Absolute path of folder where the configuration file is that defines this command.' })

  return items.filter(item => vars.includes(item.name))
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
  secondary.textContent = item.description

  li.classList.add('event', 'two-lines')
  li.appendChild(primary)
  li.appendChild(secondary)

  return li
}

class ChooseVariableModal {

  constructor(callback, items) {
    this.callback = callback
    this.items = items

    this.selectList = new SelectList({
      items,
      elementForItem,
      filterKeyForItem: item => item.name,
      didConfirmSelection: item => {
        this.confirmed(item)
      },
      didConfirmEmptySelection: () => {
        this.cancel()
      },
      didCancelSelection: () => {
        this.cancel()
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

  cancel() {
    this.close()
    this.callback(null)
  }


  close() {
    if (this.panel) {
      this.panel.destroy()
    }
  }

  confirmed(item) {
    this.close()
    this.callback(item.name)
  }

}
