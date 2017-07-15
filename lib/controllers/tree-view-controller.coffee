module.exports =
class TreeViewController

  constructor: (@main) ->
    @editConfigDisposable = null;

  recreateContextMenu: ->
    @recreateCommandMenuItems();
    # Place the 'Edit Configuration' menu item at the bottom.
    @recreateEditConfigMenuItem();

  recreateCommandMenuItems: ->
    # Get all the config controllers and sort them alphabetically by action.
    configCtrls = @main.getAllConfigControllers();
    configCtrls.sort (a, b) -> a.config.action.localeCompare(b.config.action)
    configCtrls.forEach (c) -> c.recreateTreeViewMenuItem()

  recreateEditConfigMenuItem: ->
    @editConfigDisposable?.dispose();

    root = {
      label: 'Run With',
      submenu: [
        { type: 'separator' }
        {
          label: 'Edit Configuration',
          command: 'process-palette:edit-configuration'
        }
      ]
    };

    @editConfigDisposable = atom.contextMenu.add({'.tree-view': [root]});

  dispose: ->
    # It is not necessary to dispose of each config controller's menu items.
    # These will be disposed of when the config controllers are disposed of.
    @editConfigDisposable?.dispose();
