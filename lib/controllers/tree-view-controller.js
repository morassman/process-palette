/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let TreeViewController;
module.exports =
(TreeViewController = class TreeViewController {

  constructor(main) {
    this.main = main;
    this.editConfigDisposable = null;
  }

  recreateContextMenu() {
    this.recreateCommandMenuItems();
    // Place the 'Edit Configuration' menu item at the bottom.
    return this.recreateEditConfigMenuItem();
  }

  recreateCommandMenuItems() {
    // Get all the config controllers and sort them alphabetically by action.
    const configCtrls = this.main.getAllConfigControllers();
    configCtrls.sort((a, b) => a.config.action.localeCompare(b.config.action));
    return configCtrls.forEach(c => c.recreateTreeViewMenuItem());
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

    return this.editConfigDisposable = atom.contextMenu.add({'.tree-view': [root]});
  }

  dispose() {
    // It is not necessary to dispose of each config controller's menu items.
    // These will be disposed of when the config controllers are disposed of.
    return (this.editConfigDisposable != null ? this.editConfigDisposable.dispose() : undefined);
  }
});
