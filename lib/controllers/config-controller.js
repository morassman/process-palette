/** @babel */

const _ = require('underscore-plus');
const ProcessController = require('./process-controller');
const { CompositeDisposable } = require('atom');

export default class ConfigController {

  constructor(projectController, config) {
    this.projectController = projectController;
    this.config = config;
    this.processControllers = [];
    this.listeners = [];
    this.patterns = this.projectController.getPatterns(this.config.patterns);
    this.lastTime = null;
    this.atomCommandDisposables = new CompositeDisposable()
    this.atomKeymapDisposables = new CompositeDisposable()
    this.atomMenuDisposables = new CompositeDisposable()
    this.atomContextMenuDisposables = null;

    let cssSelector = 'atom-workspace';

    if (this.config.outputTarget === 'editor') {
      cssSelector = 'atom-text-editor';
    }

    this.atomCommandDisposables.add(atom.commands.add(cssSelector, this.config.getCommandName(), () => this.runProcess()));

    if (this.config.keystroke) {
      const binding = {};
      const bindings = {};
      binding[this.config.keystroke] = this.config.getCommandName();
      bindings[cssSelector] = binding;
      this.atomKeymapDisposables.add(atom.keymaps.add(this.config.getCommandName(), bindings));
    }

    this.addMenus();
  }

  canShowProcessOutput() {
    return ["panel", "terminal", "console", "file"].includes(this.config.outputTarget)
  }

  addMenus() {
    let menu;
    if (this.config.menus.length === 0) {
      return;
    }

    const root = {};
    let leaf = root;
    for (menu of this.config.menus) {
      const child = {};
      leaf['label'] = menu;
      leaf['submenu'] = [child];
      leaf = child;
    }

    leaf['label'] = _.humanizeEventName(this.config.action);
    leaf['command'] = this.config.getCommandName();
    this.atomMenuDisposables.add(atom.menu.add([root]));
  }

  // Adds a menu item to the tree-view's context menu to run this command with
  // the selected path in the tree view. An item is only added if this command
  // takes a file as input.
  recreateTreeViewMenuItem() {
    this.disposeTreeViewMenuItem();

    if (!this.inputUsesFileVariables()) {
      return;
    }

    // Create a command that will run this process with the tree view's selected path.
    const commandName = 'tree-view-run-with:' + this.config.action;

    this.atomContextMenuDisposables = new CompositeDisposable()
    this.atomContextMenuDisposables.add(atom.commands.add('atom-workspace', commandName, () => this.runProcessFromTreeView()));
    const shouldEnable = () => this.shouldTreeViewMenuEnable();

    // NB. Notice that the function assigned to 'created' uses '->' instead of '=>'.
    // This is so that @ points to the menu item and not ConfigController.

    const root = {
      label: 'Run With',
      submenu: [
        {
          label: _.humanizeEventName(this.config.action),
          command: commandName,
          created() { return this.enabled = shouldEnable(); }
        }
      ]
    };

    this.atomContextMenuDisposables.add(atom.contextMenu.add({ '.tree-view': [root] }));
  }

  // This is called when the command was edited directly from the panel.
  // If the command previously didn't depend on a file and does now, then
  // a context menu item will be created for it. If the command did depend
  // on a file, but now doesn't anymore then the menu item is removed.
  recreateTreeViewMenuItemIfNeeded() {
    const hasCtxMenu = (this.atomContextMenuDisposables != null);
    const usesFileVars = this.inputUsesFileVariables();

    // Do nothing if there is already a menu item and it is still needed.
    if (hasCtxMenu && !usesFileVars) {
      this.disposeTreeViewMenuItem();
    } else if (!hasCtxMenu && usesFileVars) {
      this.projectController.main.recreateTreeViewContextMenu();
    }
  }

  shouldTreeViewMenuEnable() {
    return document.querySelectorAll(".tree-view .selected").length > 0;
  }

  getMain() {
    return this.projectController.getMain();
  }

  getProjectController() {
    return this.projectController;
  }

  getConfig() {
    return this.config;
  }

  getLastTime() {
    return this.lastTime;
  }

  saveFile() {
    this.projectController.saveFile();
  }

  // Changes the command to execute. This is called when editing the command from the panel.
  setCommand(command) {
    this.config.command = command;
    this.getMain().setDirty(true);
    this.recreateTreeViewMenuItemIfNeeded();
  }
    // @saveFile();

  getFirstProcessController() {
    if (this.processControllers.length === 0) {
      return null;
    }

    return this.processControllers[0];
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);

    if (index !== -1) {
      return this.listeners.splice(index, 1);
    }
  }

  dispose() {
    this.killRunningProcesses();
    this.clearControllers();
    this.disposeTreeViewMenuItem();
    this.atomCommandDisposables.dispose()
    this.atomKeymapDisposables.dispose()
    this.atomMenuDisposables.dispose();
  }

  disposeTreeViewMenuItem() {
    if (this.atomContextMenuDisposables != null) {
      this.atomContextMenuDisposables.dispose();
    }

    this.atomContextMenuDisposables = null;
  }

  clearControllers() {
    const copy = [...this.processControllers]
    copy.forEach((processController) => processController.dispose());
  }

  runProcess() {
    let filePath = null;
    const textEditor = atom.workspace.getActiveTextEditor();

    if (textEditor != null) {
      filePath = textEditor.getPath();
    }

    // Do not run the command if it depends on a file when there isn't one.
    if ((filePath == null) && this.inputUsesFileVariables()) {
      const notifOptions = {};
      notifOptions["dismissable"] = true;

      // filePath is null if there aren't any text editors.
      // filePath is undefined if there is a text editor open, but it hasn't been saved before.
      if (filePath === null) {
        notifOptions["detail"] = "This command requires a file path. Either open a file in the workspace or choose 'Run With' on a file in the tree view.";
      } else {
        notifOptions["detail"] = "The file needs to be saved before this command can be executed on it.";
      }

      atom.notifications.addWarning(`Cannot execute ${this.config.getHumanizedCommandName()}`, notifOptions);
      return;
    }

    this.runProcessWithFile(filePath);
  }

  runProcessFromTreeView() {
    const selected = document.querySelectorAll(".tree-view .selected > .list-item > .name, .tree-view .selected > .name");
    if (selected.length > 0) {
      this.runProcessWithFile(selected[0].dataset.path);
    }
  }

  runProcessWithFile(filePath) {
    if (this.config.singular) {
      this.killRunningProcesses();
    }

    const processController = new ProcessController(this, this.config);
    processController.runProcessWithFile(filePath);
  }

  killRunningProcesses() {
    const clone = this.processControllers.slice(0);
    clone.forEach((pc) => pc.killProcess());
  }

  removeProcessController(processController) {
    processController.dispose();
    const index = this.processControllers.indexOf(processController);

    if (index !== -1) {
      this.processControllers.splice(index, 1);
      processController.hasBeenRemoved();
      this.notifyProcessControllerRemoved(processController);
    }
  }

  removeOldest() {
    if ((this.config.maxCompleted == null)) {
      return;
    }

    let oldest = null;
    let count = 0;

    for (let start = this.processControllers.length-1, i = start, asc = start <= 0; asc ? i <= 0 : i >= 0; asc ? i++ : i--) {
      if (this.processControllers[i].endTime !== null) {
        count++;
        if ((oldest === null) || (this.processControllers[i].endTime < oldest.endTime)) {
          oldest = this.processControllers[i];
        }
      }
    }

    if (count <= this.config.maxCompleted) {
      return;
    }

    if (oldest !== null) {
      this.removeProcessController(oldest);
    }
  }

  autoHideOutput(processController) {
    // Check to see if autoHideOutput is true.
    if (!processController.config.autoHideOutput) {
      return;
    }

    const main = this.projectController.getMain();

    // Only hide if this process' output is being shown.
    if (!main.isProcessOutputShown(processController)) {
      return;
    }

    // Only hide if the process wasn't killed and exited successfully.
    if (processController.isKilled() || (processController.getExitStatus() !== 0)) {
      return;
    }

    main.hidePanel();
  }

  // Return true if any of the inputs use any of the {file*} variables.
  inputUsesFileVariables() {
    const r = new RegExp("{file.*?}","g");

    if (r.test(this.config.command) || r.test(this.config.cwd)) {
      return true;
    }

    if (this.config.env != null) {
      for (let key in this.config.env) {
        const val = this.config.env[key];
        if (r.test(val)) {
          return true;
        }
      }
    }

    if ((this.config.input != null) && r.test(this.config.input)) {
      return true;
    }

    return false;
  }

  // Returns a string describing the output target.
  getTargetDescription() {
    if (this.config.stream) {
      return 'Stream to ' + this.config.outputTarget;
    }

    return 'Output to ' + this.config.outputTarget;
  }

  guiEdit() {
    return this.getMain().guiEditCommand(this);
  }

  notifyProcessStarted(processController) {
    this.processControllers.push(processController);
    this.lastTime = new Date().getTime();
    processController.hasBeenAdded();
    _.invoke(_.clone(this.listeners), "processStarted", processController);
  }

  notifyProcessStopped(processController) {
    this.autoHideOutput(processController);
    this.removeOldest();
    _.invoke(_.clone(this.listeners), "processStopped", processController);

    if ((this.config.outputTarget !== "panel") && (this.config.outputTarget !== "terminal") && (this.config.outputTarget !== "file")) {
      this.removeProcessController(processController);
    }
  }

  notifyProcessControllerRemoved(processController) {
    _.invoke(_.clone(this.listeners), "processControllerRemoved", processController);
  }

}
