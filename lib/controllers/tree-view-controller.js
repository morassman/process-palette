/** @babel */

export default class TreeViewController {

  constructor(main) {
    this.main = main;
    this.editConfigDisposable = null;
  }

  recreateContextMenu() {
    this.recreateCommandMenuItems();
    // Place the 'Edit Configuration' menu item at the bottom.
    this.recreateEditConfigMenuItem();
  }

  recreateCommandMenuItems() {
    // Get all the config controllers and sort them alphabetically by action.
    const configCtrls = this.main.getAllConfigControllers();
    configCtrls.sort((a, b) => a.config.action.localeCompare(b.config.action));
    configCtrls.forEach(c => c.recreateTreeViewMenuItem());
  }

  recreateEditConfigMenuItem() {
    if (this.editConfigDisposable != null) {
      this.editConfigDisposable.dispose();
    }

    const root = {
      label: 'Run With',
      submenu: [
        { type: 'separator' },
        {
          label: 'Edit Configuration',
          command: 'process-palette:edit-configuration'
        }
      ]
    };

    this.editConfigDisposable = atom.contextMenu.add({ '.tree-view': [root] });
  }

  dispose() {
    // It is not necessary to dispose of each config controller's menu items.
    // These will be disposed of when the config controllers are disposed of.
    if (this.editConfigDisposable) {
      this.editConfigDisposable.dispose()
    }
  }

}
