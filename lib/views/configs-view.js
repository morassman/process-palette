/** @babel */
const { File, Directory } = require('atom');
const { SelectListView } = require('atom-space-pen-views');

export default function showConfigsView(main, showGlobal) {
  const items = refreshItems(showGlobal)

  if (items.length === 0) {
    return;
  }

  if (items.length === 1) {
    main.guiEditConfiguration(items[0].global, items[0].projectName, items[0].path)
    return;
  }

  const view = new ConfigsView(main, showGlobal, items)
}

function refreshItems(showGlobal) {
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

  for (let projectPath of Array.from(atom.project.getPaths())) {
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

class ConfigsView extends SelectListView {

  constructor(main, showGlobal, items) {
    super();
    this.main = main;
    if (showGlobal == null) { showGlobal = true; }
    this.showGlobal = showGlobal;
    this.setItems(items)
    if (this.panel == null) {
      this.panel = atom.workspace.addModalPanel({ item: this });
    }
    this.panel.show();
    this.focusFilterEditor();
  }

  initialize() {
    super.initialize();

    this.addClass('overlay from-top');
    // const items = this.refreshItems();

    // if (items.length === 0) {
    //   return;
    // }

    // if (items.length === 1) {
    //   this.openItem(items[0]);
    //   return;
    // }

    // this.setItems(items);

    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({ item: this }); }
    this.panel.show();
    return this.focusFilterEditor();
  }

  refreshItems() {
    let item;
    const items = [];

    if (this.showGlobal) {
      const configFile = new File(atom.config.getUserConfigPath());

      item = {};
      item.global = true;
      item.title = 'Global Configuration';
      item.projectName = '';
      item.path = configFile.getParent().getRealPathSync();
      items.push(item);
    }

    for (let projectPath of Array.from(atom.project.getPaths())) {
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

  getFilterKey() {
    return "title";
  }

  viewForItem(item) {
    return `\
      <li class='two-lines'>
      <div class='primary-line'>${item.title}</div>
      <div class='secondary-line'>${item.path}</div>
      </li>`;
  }

  // return "<li><span class='badge badge-info'>#{item.bookmark.name}</span> #{item.bookmark.path}</li>";

  openItem(item) {
    return this.main.guiEditConfiguration(item.global, item.projectName, item.path);
  }

  confirmed(item) {
    this.cancel();
    return this.openItem(item);
  }

  cancelled() {
    this.hide();
    return (this.panel != null ? this.panel.destroy() : undefined);
  }
}
