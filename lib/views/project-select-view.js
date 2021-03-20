/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProjectSelectView;
const {Directory} = require('atom');
const {SelectListView} = require('atom-space-pen-views');

// This view is used as a modal for selecting one of the projects that are open in Atom.
module.exports =
(ProjectSelectView = class ProjectSelectView extends SelectListView {

  constructor(callback, path) {
    super();
    this.callback = callback;
    if (path == null) { path = true; }
    this.path = path;

  }

  initialize() {
    super.initialize();

    this.addClass('overlay from-top');
    const items = this.refreshItems();

    if (items.length === 0) {
      return;
    }

    if (items.length === 1) {
      this.openItem(items[0]);
      return;
    }

    this.setItems(items);

    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({item: this}); }
    this.panel.show();
    return this.focusFilterEditor();
  }

  refreshItems() {
    const items = [];

    for (let projectPath of Array.from(atom.project.getPaths())) {
      const dir = new Directory(projectPath);
      const item = {};
      item.name = dir.getBaseName();
      item.path = projectPath;
      items.push(item);
    }

    return items;
  }

  getFilterKey() {
    return "name";
  }

  viewForItem(item) {
    return `\
<li class='two-lines'>
<div class='primary-line'>${item.name}</div>
<div class='secondary-line'>${item.path}</div>
</li>`;
  }

  openItem(item) {
    if ((item == null)) {
      return this.callback(null);
    } else if (this.path) {
      return this.callback(item.path);
    } else {
      return this.callback(item.name);
    }
  }

  confirmed(item) {
    this.hide();
    if (this.panel != null) {
      this.panel.destroy();
    }
    return this.openItem(item);
  }

  cancelled() {
    this.hide();
    return (this.panel != null ? this.panel.destroy() : undefined);
  }
});
