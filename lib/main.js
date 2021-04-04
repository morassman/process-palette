/** @babel */

const _ = require('underscore-plus')
const { Directory, File, CompositeDisposable } = require('atom')
const MainView = require('./views/main-view')
const TreeViewController = require('./controllers/tree-view-controller')
const Path = require('path')
const showConfigSelectModal = require('./views/modals/config-select-modal')
const MainEditView = require('./views/edit/main-edit-view')
const ProjectController = require('./controllers/project-controller')
const { existsSync } = require('fs')

const URI = 'atom://process-palette'

function getDefaultShell() {
  if (process.platform === "win32") {
    // Give preference to powershell
    // let path = Path.resolve(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    // if (existsSync(path)) {
    //   return path
    // }

    return process.env.COMSPEC || "cmd.exe"
  }

  return process.env.SHELL || "/bin/bash"
}

function getDefaultShellArguments() {
  if (process.platform !== "win32" && process.env.SHELL === "/bin/bash") {
    return "--login"
  } else {
    return ""
  }
}

export default {

  config: {
    terminal: {
      type: "object",
      properties: {
        shell: {
          title: "Shell",
          description: "The shell to run commands with and to use in terminal tabs.",
          type: "string",
          default: getDefaultShell()
        },
        shellArguments: {
          title: "Shell Arguments",
          description: "Arguments to pass to the shell.",
          type: "string",
          default: getDefaultShellArguments()
        },
        type: {
          title: "Type",
          description: "The type of terminal to use.",
          type: "string",
          default: "xterm-256color"
        }
      }
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
        },
        showNamespaceInTabs: {
          title: "Show namespace in the tab title",
          type: "boolean",
          default: true
        },
        showNamespaceInList: {
          title: "Show namespace in the list of commands",
          type: "boolean",
          default: true
        }
      }
    },
    fontFamily: {
      title: "Font Family",
      description: "The name of the font to use for the terminal and for displaying process output.",
      type: "string",
      default: "Menlo, Consolas, DejaVu Sans Mono, monospace"
    },
    fontSize: {
      title: "Font Size",
      description: "The size of the font in pixels to use for the terminal and for displaying process output.",
      type: "number",
      minimum: 1,
      default: 15
    }
  },

  activate(state) {
    this.upgradeConfig()

    this.state = state
    this.dirty = false
    this.disposables = new CompositeDisposable()
    this.projectControllers = []
    this.mainView = new MainView(this)
    this.treeViewController = new TreeViewController(this)

    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:show': () => this.showPanel() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:hide': () => this.hidePanel() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:toggle': () => this.togglePanel() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:rerun-last': () => this.runLast() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:kill-focused-process': () => this.mainView.killFocusedProcess(false) }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:kill-and-remove-focused-process': () => this.mainView.killFocusedProcess(true) }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:remove-focused-output': () => this.mainView.discardFocusedOutput() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:edit-configuration': () => this.editConfiguration(true) }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:reload-configuration': () => this.reloadConfiguration() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:add-terminal': () => this.mainView.addTerminal() }))
    this.disposables.add(atom.commands.add('atom-workspace', { 'process-palette:add-custom-terminal': () => this.mainView.addCustomTerminal() }))
    this.disposables.add(atom.commands.add('atom-workspace', {
      'core:cancel': () => this.hidePanel(),
      'core:close': () => this.hidePanel()
    }))

    // this.disposables.add(atom.commands.add('process-palette-terminal-output', { 'process-palette:copy': () => console.log('copy') }))

    // TODO : Enable this again later to support 'on-save' behavior.
    // @disposables.add atom.workspace.observeTextEditors (editor) =>
    //   @disposables.add editor.onDidSave (event) =>
    //     @fileSaved(event.path);

    this.disposables.add(atom.workspace.addOpener(uri => {
      if (uri === URI) {
        return this.mainView
      }
    }))

    this.disposables.add(atom.project.onDidChangePaths(paths => this.projectsChanged(paths)))

    process.nextTick(() => {
      if (this.state.visible) {
        this.showPanel(false)
      }

      this.load()
    })
  },

  upgradeConfig() {
    // The 'outputPanel' section was removed. The 'fontSize' that used to
    // be in it is now in the root of the config.

    try {
      const outputPanel = atom.config.get('process-palette.outputPanel')

      if (!outputPanel) {
        return
      }

      const fontSize = outputPanel.fontSize || 15

      atom.config.set('process-palette.fontSize', fontSize)
      atom.config.unset('process-palette.outputPanel')
    } catch (error) {
    }
  },

  deactivate() {
    this.disposables.dispose()
    this.disposeProjectControllers()
    this.treeViewController.dispose()
    this.mainView.deactivate()
  },

  disposeProjectControllers() {
    this.projectControllers.forEach((projectController) => projectController.dispose())
  },

  serialize() {
    if (this.mainView !== null) {
      let state = {}
      state.visible = this.getDock() !== null
      return state
    }

    return this.state
  },

  fileSaved(path) {
    this.projectControllers.forEach((projectController) => projectController.fileSaved(path))
  },

  load() {
    // Remove all key bindings.
    atom.keymaps.removeBindingsFromSource('process-palette')

    const configFile = new File(atom.config.getUserConfigPath())
    this.addProjectPath(configFile.getParent().getRealPathSync())

    for (let projectPath of atom.project.getPaths()) {
      this.addProjectPath(projectPath)
    }
  },

  projectsChanged(paths) {
    // Add controllers for new project paths.
    let projectCtrl

    for (let path of paths) {
      if (this.getProjectControllerWithPath(path) === null) {
        this.addProjectPath(path)
      }
    }

    // Remove controllers of old project paths.
    const toRemove = []
    for (projectCtrl of this.projectControllers) {
      if (!projectCtrl.isGlobal() && (paths.indexOf(projectCtrl.getProjectPath()) < 0)) {
        toRemove.push(projectCtrl)
      }
    }

    if (toRemove.length === 0) {
      return
    }

    for (projectCtrl of toRemove) {
      this.removeProjectController(projectCtrl)
    }
  },

  getProjectControllerWithPath(projectPath) {
    for (let projectController of this.projectControllers) {
      if (projectController.getProjectPath() === projectPath) {
        return projectController
      }
    }

    return null
  },

  reloadConfiguration(saveConfigEditors) {
    this.treeViewController.dispose()
    this.treeViewController = new TreeViewController(this)

    if (saveConfigEditors) {
      this.saveConfigEditors()
    }

    if (this.mainView.isHomeTabVisible()) {
      this.mainView.showListView()
    }

    for (let projectController of this.projectControllers) {
      projectController.dispose()
    }

    this.projectControllers = []
    this.load()

    atom.notifications.addInfo("Process Palette configurations reloaded")
  },

  togglePanel() {
    if (this.isVisibleInDock()) {
      this.hidePanel()
    } else {
      this.showPanel()
    }
  },

  showPanel(activate = true) {
    atom.workspace.open(URI, {
      searchAllPanes: true,
      activatePane: activate,
      activateItem: activate
    })
  },

  hidePanel() {
    atom.workspace.hide(this.mainView)
  },

  isVisible() {
    return this.isVisibleInDock()
  },

  isVisibleInDock() {
    const dock = this.getDock()

    if ((dock == null) || !dock.isVisible()) {
      return false
    }

    if ((dock.getActivePane() == null)) {
      return false
    }

    return dock.getActivePane().getActiveItem() === this.mainView
  },

  getDock() {
    if (atom.workspace.getBottomDock().getPaneItems().indexOf(this.mainView) >= 0) {
      return atom.workspace.getBottomDock()
    }
    if (atom.workspace.getLeftDock().getPaneItems().indexOf(this.mainView) >= 0) {
      return atom.workspace.getLeftDock()
    }
    if (atom.workspace.getRightDock().getPaneItems().indexOf(this.mainView) >= 0) {
      return atom.workspace.getRightDock()
    }

    return null
  },

  runLast() {
    const configController = this.getLastRunConfigController()
    if (configController) {
      configController.runProcess()
    }
  },

  showListView() {
    this.showPanel()
    this.mainView.showListView()
  },

  showProcessOutput(processController) {
    this.showPanel()
    this.mainView.showProcessOutput(processController)
  },

  isProcessOutputShown(processController) {
    return this.mainView.isProcessOutputShown(processController)
  },

  processControllerAdded(processController) {
    this.mainView.processControllerAdded(processController)
  },

  processControllerRemoved(processController) {
    this.mainView.processControllerRemoved(processController)
  },

  addProjectPath(projectPath) {
    const file = new Directory(projectPath).getFile('process-palette.json')

    if (!file.existsSync()) {
      return
    }

    const projectController = new ProjectController(this, projectPath)
    this.projectControllers.push(projectController)
    this.mainView.addProjectView(projectController.view)
  },

  removeProjectController(projectController) {
    const index = this.projectControllers.indexOf(projectController)

    if (index < 0) {
      return
    }

    this.projectControllers.splice(index, 1)
    projectController.dispose()
  },

  editConfiguration(showGlobal) {
    showConfigSelectModal(this, showGlobal)
  },

  guiEditConfiguration(global, projectName, folderPath) {
    let title = global ? 'Global Configuration' : `Project: ${projectName}`

    // If there is a process-palette.json file then open it. If not then
    // create a new file and load the example into it.
    const file = new File(Path.join(folderPath, 'process-palette.json'))

    if (!file.existsSync()) {
      const packagePath = atom.packages.getActivePackage('process-palette').path
      const exampleFileName = process.platform === "win32" ? 'process-palette-win.json' : 'process-palette.json'
      const exampleFile = new File(Path.join(packagePath, 'examples', exampleFileName))

      exampleFile.read(false).then(content => {
        file.create().then(() => {
          file.writeSync(content)
          this.addProjectPath(folderPath)
          this.guiOpenFile(title, file)
        })
      })
    } else {
      this.guiOpenFile(title, file)
    }
  },

  guiEditCommand(configController) {
    const projectController = configController.getProjectController()
    const file = projectController.getConfigurationFile()
    const { action } = configController.getConfig()
    const title = projectController.isGlobal() ? 'Global Configuration' : `Project: ${projectController.getProjectName()}`

    this.guiOpenFile(title, file, action)
  },

  guiOpenFile(title, file, selectedAction = null) {
    let pane

    // If the file is already open then activate its pane.
    const filePath = file.getRealPathSync()
    let paneItem = this.getPaneItem(filePath)

    if (paneItem != null) {
      pane = atom.workspace.paneForItem(paneItem)
      pane.activateItem(paneItem)
      return
    }

    const main = this

    file.read(false).then(content => {
      const config = JSON.parse(content)
      if (!_.isObject(config.patterns)) {
        config.patterns = {}
      }
      if (!_.isArray(config.commands)) {
        config.commands = []
      }

      const view = new MainEditView(main, title, filePath, config, selectedAction)
      view.addPaneItem()
    })
  },

  // Called when the save button was pressed. This saves changes that were made
  // to the command directly in the panel.
  savePanel() {
    for (let projectController of this.projectControllers) {
      projectController.saveFile()
    }

    this.setDirty(false)
  },

  saveConfigEditors() {
    const paneItems = atom.workspace.getPaneItems()

    for (let paneItem of paneItems) {
      if (paneItem instanceof MainEditView) {
        paneItem.saveChanges()
      }
    }

    this.setDirty(false)
  },

  getPaneItem(filePath) {
    const paneItems = atom.workspace.getPaneItems()

    for (let paneItem of paneItems) {
      if (paneItem instanceof MainEditView) {
        if (paneItem.filePath === filePath) {
          return paneItem
        }
      }
    }

    return null
  },

  // getConfigController(namespace, action) {
  //   for (let projectController of Array.from(this.projectControllers)) {
  //     const configController = projectController.getConfigController(namespace, action);

  //     if (processController) {
  //       return processController;
  //     }
  //   }

  //   return null;
  // },

  getLastRunConfigController() {
    let result = null
    const configControllers = this.getAllConfigControllers()

    for (let configController of configControllers) {
      const lastTime = configController.getLastTime()

      if (lastTime != null) {
        if ((result == null) || (result.getLastTime() < lastTime)) {
          result = configController
        }
      }
    }

    return result
  },

  getAllConfigControllers() {
    let result = []

    for (let projectController of this.projectControllers) {
      result = result.concat(projectController.getConfigControllers())
    }

    return result
  },

  setDirty(dirty) {
    if (this.dirty !== dirty) {
      this.dirty = dirty
      this.mainView.setSaveButtonVisible(this.dirty)
    }
  },

  recreateTreeViewContextMenu() {
    this.treeViewController.recreateContextMenu()
  }
}
