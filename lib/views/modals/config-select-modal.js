/** @babel */

const { File, Directory } = require('atom');
const SelectList = require('atom-select-list')

export default function showConfigSelectModal(main, showGlobal) {
  const items = getItems(showGlobal)

  if (items.length === 0) {
    return;
  }

  if (items.length === 1) {
    main.guiEditConfiguration(items[0].global, items[0].projectName, items[0].path)
    return;
  }

  const view = new ConfigSelectModal(main, showGlobal, items)
  view.open()
}

function getItems(showGlobal) {
  let item;
  const items = [];

  if (showGlobal) {
    const configFile = new File(atom.config.getUserConfigPath());

    item = {};
    item.global = true;
    item.title = 'Global Configuration';
    item.projectName = '';
    item.path = configFile.getParent().getRealPathSync();
    items.push(item);
  }

  for (let projectPath of atom.project.getPaths()) {
    const dir = new Directory(projectPath);
    item = {};
    item.false = true;
    item.title = 'Project: ' + dir.getBaseName();
    item.projectName = dir.getBaseName();
    item.path = projectPath;
    items.push(item);
  }

  return items;
}

function elementForItem(item, options) {
  const li = document.createElement('li')

  if (!options.visible) {
    return li
  }

  const primary = document.createElement('div')
  primary.classList.add('primary-line')
  primary.textContent = item.title

  const secondary = document.createElement('div')
  secondary.classList.add('secondary-line')
  secondary.textContent = item.path

  li.classList.add('event', 'two-lines')
  li.appendChild(primary)
  li.appendChild(secondary)

  return li
}

class ConfigSelectModal {

  constructor(main, showGlobal, items) {
    this.main = main
    this.showGlobal = showGlobal
    this.items = items

    this.selectList = new SelectList({
      items,
      elementForItem,
      filterKeyForItem: item => item.title,
      didConfirmSelection: item => {
        this.close()
        this.openItem(item)
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

  openItem(item) {
    this.main.guiEditConfiguration(item.global, item.projectName, item.path);
  }

}
