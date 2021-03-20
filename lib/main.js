/** @babel */

/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('underscore-plus');
const { Directory, File, CompositeDisposable } = require('atom');
const MainView = require('./views/main-view');
const TreeViewController = require('./controllers/tree-view-controller');
const Path = require('path');
const showConfigsView = require('./views/configs-view');
const MainEditView = require('./views/edit/main-edit-view');
const ProjectController = require('./controllers/project-controller');

const URI = 'atom://process-palette';

export default {

  config: {
    shell: {
      description: "The shell to run commands with. Leave empty for system default to be used.",
      type: "string",
      default: ""
    },
    palettePanel: {
      type: "object",
      properties: {
        showCommand: {
          title: "Show command",
          description: "Show the configured command in the palette panel",
          type: "boolean",
          default: true
        },
        showOutputTarget: {
          title: "Show output target",
          description: "Show the configured output target in the palette panel",
          type: "boolean",
          default: true
        }
      }
    }
  },

  activate(state) {
    this.state = state;
    this.dirty = false;
    this.subscriptions = new CompositeDisposable();
    this.projectControllers = [];
    this.mainView = new MainView(this);
    this.treeViewController = new TreeViewController(this);
    // @bottomPanel = atom.workspace.addBottomPanel(item: @mainView.getElement(), visible: false);

    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:show': () => this.showPanel() }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:hide': () => this.hidePanel() }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:toggle': () => this.togglePanel() }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:rerun-last': () => this.runLast() }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:kill-focused-process': () => this.mainView.killFocusedProcess(false) }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:kill-and-remove-focused-process': () => this.mainView.killFocusedProcess(true) }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:remove-focused-output': () => this.mainView.discardFocusedOutput() }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:edit-configuration': () => this.editConfiguration(true) }));
    this.subscriptions.add(atom.commands.add('atom-workspace', { 'process-palette:reload-configuration': () => this.reloadConfiguration() }));
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'core:cancel': () => this.hidePanel(),
      'core:close': () => this.hidePanel()
    }
    )
    );

    // TODO : Enable this again later to support 'on-save' behavior.
    // @subscriptions.add atom.workspace.observeTextEditors (editor) =>
    //   @subscriptions.add editor.onDidSave (event) =>
    //     @fileSaved(event.path);

    // if _.isNumber(@state.height)
    // @mainView.setViewHeight(@state.height);

    atom.workspace.addOpener(uri => {
      if (uri === URI) {
        return this.mainView;
      }
    });

    if (this.state.visible) {
      this.showPanel(false);
    }

    return process.nextTick(() => this.load());
  },

  deactivate() {
    this.subscriptions.dispose();
    this.disposeProjectControllers();
    this.treeViewController.dispose();
    return this.mainView.deactivate();
  },

  disposeProjectControllers() {
    return Array.from(this.projectControllers).map((projectController) =>
      projectController.dispose());
  },

  serialize() {
    let state;
    if (this.mainView !== null) {
      state = {};
      state.visible = this.getDock() !== null;
      return state;
    }

    return this.state;
  },

  fileSaved(path) {
    return Array.from(this.projectControllers).map((projectController) =>
      projectController.fileSaved(path));
  },

  load() {
    // Remove all key bindings.
    atom.keymaps.removeBindingsFromSource('process-palette');

    const configFile = new File(atom.config.getUserConfigPath());
    this.addProjectPath(configFile.getParent().getRealPathSync());

    for (let projectPath of Array.from(atom.project.getPaths())) {
      this.addProjectPath(projectPath);
    }

    return atom.project.onDidChangePaths(paths => this.projectsChanged(paths));
  },

  projectsChanged(paths) {
    // Add controllers for new project paths.
    let projectCtrl;
    for (let path of Array.from(paths)) {
      if (this.getProjectControllerWithPath(path) === null) {
        this.addProjectPath(path);
      }
    }

    // Remove controllers of old project paths.
    const toRemove = [];
    for (projectCtrl of Array.from(this.projectControllers)) {
      if (!projectCtrl.isGlobal() && (paths.indexOf(projectCtrl.getProjectPath()) < 0)) {
        toRemove.push(projectCtrl);
      }
    }

    if (toRemove.length === 0) {
      return;
    }

    return (() => {
      const result = [];
      for (projectCtrl of Array.from(toRemove)) {
        result.push(this.removeProjectController(projectCtrl));
      }
      return result;
    })();
  },

  getProjectControllerWithPath(projectPath) {
    for (let projectController of Array.from(this.projectControllers)) {
      if (projectController.getProjectPath() === projectPath) {
        return projectController;
      }
    }

    return null;
  },

  reloadConfiguration(saveEditors) {
    if (saveEditors == null) { saveEditors = true; }
    this.treeViewController.dispose();
    this.treeViewController = new TreeViewController(this);

    if (saveEditors) {
      this.saveEditors();
    }

    if (this.mainView.isOutputViewVisible()) {
      this.mainView.showListView();
    }

    for (let projectController of Array.from(this.projectControllers)) {
      projectController.dispose();
    }

    this.projectControllers = [];
    this.load();

    return atom.notifications.addInfo("Process Palette configurations reloaded");
  },

  togglePanel() {
    if (this.isVisibleInDock()) {
      return this.hidePanel();
    } else {
      return this.showPanel();
    }
  },

  showPanel(activate) {
    if (activate == null) { activate = true; }
    return atom.workspace.open(URI, {
      searchAllPanes: true,
      activatePane: activate,
      activateItem: activate
    });
  },

  hidePanel() {
    return atom.workspace.hide(this.mainView);
  },

  isVisible() {
    return this.isVisibleInDock();
  },

  isVisibleInDock() {
    const dock = this.getDock();

    if ((dock == null) || !dock.isVisible()) {
      return false;
    }

    if ((dock.getActivePane() == null)) {
      return false;
    }

    return dock.getActivePane().getActiveItem() === this.mainView;
  },

  getDock() {
    if (atom.workspace.getBottomDock().getPaneItems().indexOf(this.mainView) >= 0) {
      return atom.workspace.getBottomDock();
    }
    if (atom.workspace.getLeftDock().getPaneItems().indexOf(this.mainView) >= 0) {
      return atom.workspace.getLeftDock();
    }
    if (atom.workspace.getRightDock().getPaneItems().indexOf(this.mainView) >= 0) {
      return atom.workspace.getRightDock();
    }

    return null;
  },

  runLast() {
    const configController = this.getLastRunConfigController();
    return (configController != null ? configController.runProcess() : undefined);
  },

  showListView() {
    this.showPanel();
    return this.mainView.showListView();
  },

  showProcessOutput(processController) {
    this.showPanel();
    this.mainView.showProcessOutput(processController);
  },

  isProcessOutputShown(processController) {
    return this.mainView.isProcessOutputShown(processController);
  },

  processControllerRemoved(processController) {
    return this.mainView.processControllerRemoved(processController);
  },

  addProjectPath(projectPath) {
    const file = new Directory(projectPath).getFile('process-palette.json');

    if (!file.existsSync()) {
      return;
    }

    const projectController = new ProjectController(this, projectPath);
    this.projectControllers.push(projectController);
    return this.mainView.addProjectView(projectController.view);
  },

  removeProjectController(projectController) {
    const index = this.projectControllers.indexOf(projectController);

    if (index < 0) {
      return;
    }

    this.projectControllers.splice(index, 1);
    return projectController.dispose();
  },

  editConfiguration(showGlobal) {
    showConfigsView(this, showGlobal);
  },

  guiEditConfiguration(global, projectName, folderPath) {
    let title = global ? 'Global Commands' : projectName

    // If there is a process-palette.json file then open it. If not then
    // create a new file and load the example into it.
    const file = new File(Path.join(folderPath, 'process-palette.json'));

    if (!file.existsSync()) {
      const packagePath = atom.packages.getActivePackage('process-palette').path;
      const exampleFile = new File(Path.join(packagePath, 'examples', 'process-palette.json'));

      return exampleFile.read(false).then(content => {
        return file.create().then(() => {
          file.writeSync(content);
          this.addProjectPath(folderPath);
          return this.guiOpenFile(title, file);
        });
      });
    } else {
      return this.guiOpenFile(title, file);
    }
  },

  guiEditCommand(configController) {
    const projectController = configController.getProjectController();
    const file = projectController.getConfigurationFile();
    const { action } = configController.getConfig();
    const title = projectController.isGlobal() ? 'Global Commands' : projectController.getProjectName()

    return this.guiOpenFile(title, file, action);
  },

  guiOpenFile(title, file, selectedAction = null) {
    let pane;

    // If the file is already open then activate its pane.
    const filePath = file.getRealPathSync();
    let paneItem = this.getPaneItem(filePath);

    if (paneItem != null) {
      pane = atom.workspace.paneForItem(paneItem);
      pane.activateItem(paneItem);
      return;
    }

    const main = this;

    return file.read(false).then(content => {
      const config = JSON.parse(content);
      if (!_.isObject(config.patterns)) {
        config.patterns = {};
      }
      if (!_.isArray(config.commands)) {
        config.commands = [];
      }

      const view = new MainEditView(main, title, filePath, config, selectedAction);
      pane = atom.workspace.getCenter().getActivePane();
      paneItem = pane.addItem(view, { index: 0 });
      return pane.activateItem(paneItem);
    });
  },

  // Called when the save button was pressed. This saves changes that were made
  // to the command directly in the panel.
  savePanel() {
    for (let projectController of Array.from(this.projectControllers)) {
      projectController.saveFile();
    }

    return this.setDirty(false);
  },

  saveEditors() {
    const paneItems = atom.workspace.getPaneItems();

    for (let paneItem of Array.from(paneItems)) {
      if (paneItem instanceof MainEditView) {
        paneItem.saveChanges();
      }
    }

    return this.setDirty(false);
  },

  getPaneItem(filePath) {
    const paneItems = atom.workspace.getPaneItems();

    for (let paneItem of Array.from(paneItems)) {
      if (paneItem instanceof MainEditView) {
        if (paneItem.filePath === filePath) {
          return paneItem;
        }
      }
    }

    return null;
  },

  getConfigController(namespace, action) {
    for (let projectController of Array.from(this.projectControllers)) {
      const configController = projectController.getConfigController(namespace, action);

      if (processController) {
        return processController;
      }
    }

    return null;
  },

  getLastRunConfigController() {
    let result = null;
    const configControllers = this.getAllConfigControllers();

    for (let configController of Array.from(configControllers)) {
      const lastTime = configController.getLastTime();

      if (lastTime != null) {
        if ((result == null) || (result.getLastTime() < lastTime)) {
          result = configController;
        }
      }
    }

    return result;
  },

  getAllConfigControllers() {
    let result = [];

    for (let projectController of Array.from(this.projectControllers)) {
      result = result.concat(projectController.getConfigControllers());
    }

    return result;
  },

  setDirty(dirty) {
    if (this.dirty !== dirty) {
      this.dirty = dirty;
      return this.mainView.setSaveButtonVisible(this.dirty);
    }
  },

  recreateTreeViewContextMenu() {
    return this.treeViewController.recreateContextMenu();
  }
}
