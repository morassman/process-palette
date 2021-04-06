/** @babel */

const _ = require('underscore-plus')
const psTree = require('ps-tree')
const shelljs = require('shelljs')
const { CompositeDisposable } = require('atom')
const ProcessOutputView = require('../views/process-output-view')
const showUserVariableModal = require('../views/modals/user-variable-modal')
const showProjectSelectModal = require('../views/modals/project-select-modal')
const Buffer = require('./buffer')
const cp = require('child_process')
const { allowUnsafeNewFunction } = require('loophole')
const { spawn } = require('node-pty-prebuilt-multiarch')
const { Terminal } = require('xterm')
const { populateEditorFields, populateFilePathFields } = require('../utils')

// Fields :
// stdout : Standard output.
// stderr : Standard error output.
// exitStatus : Code returned by command.
// clipboard : Text currently on clipboard.
// fullCommand : The full command along with its arguments.
// configDirAbsPath : Absolute path of folder that the configuration file is in.
// projectPath : Absolute path of project folder.
//
// Only if a file is currently open :
// fileExt : Extension of file.
// fileName : Name of file without extension.
// fileNameExt : Name of file with extension.
// filePath : Path of file relative to project.
// fileDirPath : Path of file's directory relative to project.
// fileAbsPath : Absolute path of file.
// fileDirAbsPath : Absolute path of file's directory.
// selection : Currently selected text.
// fileProjectPath : Absolute path of project folder.

class Shell {

  constructor() {
    this.env = {}
    this.cwd = process.cwd()
  }

  discard() {
  }

}

class DefaultShell extends Shell {

  constructor() {
    super()
    this.envBackup = {}
  }

  startProcess(shellPath, shellArgs, command, onStdOut, onStdErr, onExit) {
    Object.keys(this.env).forEach(key => {
      this.envBackup[key] = shelljs.env[key]
      shelljs.env[key] = this.env[key]
    })

    this.pwdBackup = shelljs.pwd()

    const execOptions = { silent: true, async: true }

    if (shellPath != null) {
      shellPath = shellPath.trim()

      if (shellPath.length > 0) {
        execOptions["shell"] = shellPath
      }
    }

    shelljs.cd(this.cwd)

    this.process = shelljs.exec(command, execOptions, code => {
      onExit(code)
    })

    if (this.process) {
      this.process.stdout.on("data", onStdOut)
      this.process.stderr.on("data", onStdErr)
    }

    return this.process
  }

  killProcess() {
    try {
      if (process.platform === "win32") {
        this.killWindowsProcess()
      } else {
        this.killLinuxProcess()
      }
    } catch (err) {
      this.process.kill()
      console.log(err)
    }
  }

  killWindowsProcess() {
    const parentProcess = this.process
    const killProcess = cp.spawn("taskkill", ["/pid", this.process.pid, '/f', '/t'])

    killProcess.on("error", err => {
      parentProcess.kill()
      console.log(err)
    })

    killProcess.on("close", () => {
      parentProcess.kill()
    })
  }

  killLinuxProcess() {
    psTree(this.process.pid, (err, children) => {
      const parentProcess = this.process
      const killProcess = cp.spawn("kill", ["-9"].concat(children.map(p => p.PID)))

      killProcess.on("error", err => {
        parentProcess.kill()
        console.log(err)
      })

      killProcess.on("close", () => {
        parentProcess.kill()
      })
    })
  }

  write(data) {
    this.process.stdin.write(data)
    this.process.stdin.uncork()
    this.process.stdin.end()
  }

  processStopped() {
    Object.keys(this.envBackup).forEach(key => {
      const val = this.envBackup[key]

      if (val === undefined) {
        delete shelljs.env[key]
      } else {
        shelljs.env[key] = val
      }
    })

    shelljs.cd(this.pwdBackup)
  }

}

class TerminalShell extends Shell {

  constructor() {
    super()
    this.env = { ...process.env }
    this.disposable = new CompositeDisposable()

    const fontFamily = atom.config.get('process-palette.fontFamily')
    let fontSize = atom.config.get('process-palette.fontSize')

    if (!fontSize) {
      fontSize = 15
    }

    this.xterm = new Terminal({
      cursorBlink: false,
      cursorStyle: 'underline',
      fontFamily,
      fontSize
    })
  }

  startProcess(shellPath, shellArgs, command, onStdOut, onStdErr, onExit) {
    const name = atom.config.get("process-palette.terminal.type")

    this.process = spawn(shellPath, shellArgs, {
      name,
      cols: 80,
      rows: 40,
      cwd: this.cwd,
      env: this.env
    })

    if (this.process) {
      this.disposable.add(this.xterm.onData(data => {
        if (this.process) {
          this.process.write(data)
        }
      }))

      this.disposable.add(this.process.onData(data => {
        this.xterm.write(data)
        onStdOut(data)
      }))

      this.disposable.add(this.process.onExit(({ exitCode }) => onExit(exitCode)))
      this.process.write(`${command}\r`)
    }

    return this.process
  }

  // This is called after the fit addon has executed.
  fit() {
    if (this.process && this.xterm) {
      this.process.resize(this.xterm.cols, this.xterm.rows)
    }
  }

  killProcess() {
    this.process.kill()
  }

  write(data) {
    this.process.write(data)
  }

  processStopped() {
    this.disposable.dispose()
  }

  discard() {
    if (this.xterm) {
      this.xterm.dispose()
    }
  }

}

export default class ProcessController {

  constructor(configController, config) {
    this.configController = configController
    this.config = config
    this.processCallbacks = []
    this.replaceRegExp = new RegExp("{.*?}", "g")
    this.fields = {}
    this.options = {}
    this.newFile = null
    this.creatingNewFile = false
    this.newFileDisposable = null
    this.endTime = null
    this.outputView = null
    this.stdoutBuffer = new Buffer(this.config.outputBufferSize)
    this.stderrBuffer = new Buffer(this.config.outputBufferSize)
    this.killed = false
    this.exitStatus = null
    this.autoDiscard = false
    this.disposed = false
    this.process = null

    if (this.config.outputTarget === 'terminal') {
      this.shell = new TerminalShell()
    } else {
      this.shell = new DefaultShell()
    }

    if (this.config.outputTarget === "panel" || this.config.outputTarget === 'terminal') {
      this.outputView = new ProcessOutputView(this.configController.getMain(), this, this.config.outputTarget)
    }

    this.streamTarget = this.createStreamTarget()
  }

  createStreamTarget() {
    const noop = (data) => { }

    if (!this.config.stream) {
      return noop
    }

    if (this.config.outputTarget === "editor") {
      return (data) => {
        const editor = atom.workspace.getActiveTextEditor()

        if (editor != null) {
          editor.insertText(data)
        }
      }

    } else if (this.config.outputTarget === "clipboard") {
      return atom.clipboard.write(data)
    } else if (this.config.outputTarget === "console") {
      return console.log
    } else if (this.config.outputTarget === "panel") {
      return (data) => this.outputView.streamOutput(data)
    } else if (this.config.outputTarget === "file") {
      return (data) => this.outputToNewFile(data)
    }

    return noop
  }

  getProcessID() {
    return this.processID
  }

  isKilled() {
    return this.killed
  }

  getExitStatus() {
    return this.exitStatus
  }

  dispose() {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.killProcess(true)

    if (this.newFileDisposable != null) {
      this.newFileDisposable.dispose()
    }

    if (this.outputView) {
      this.outputView.destroy()
    }
  }

  showProcessOutput() {
    const { outputTarget } = this.config

    if (outputTarget === "panel" || outputTarget === "terminal") {
      this.configController.getMain().showProcessOutput(this)
    } else if (outputTarget === "console") {
      atom.openDevTools()
    } else if (outputTarget === "file") {
      this.showNewFile()
    }
  }

  hasBeenAdded() {
    this.configController.getMain().processControllerAdded(this)
  }

  hasBeenRemoved() {
    this.configController.getMain().processControllerRemoved(this)
  }

  runProcessWithFile(filePath) {
    // Return if there is already a process running.
    if (this.process) {
      return
    }

    this.fields = {}
    this.options = {}

    this.fields.clipboard = atom.clipboard.read()
    this.fields.configDirAbsPath = this.configController.projectController.projectPath
    this.fields.stdout = ""
    this.fields.stderr = ""
    this.fields.selectProjectPath = ""

    const projectPaths = atom.project.getPaths()

    if (projectPaths.length > 0) {
      this.fields.projectPath = projectPaths[0]
    } else {
      this.fields.projectPath = this.configController.projectController.projectPath
    }

    const editor = atom.workspace.getActiveTextEditor()
   
    populateEditorFields(this.fields, editor)
    populateFilePathFields(this.fields, filePath)

    this.saveDirtyFiles()
  }


  // Return true if the execution should continue. false if the user canceled.
  saveDirtyFiles() {
    if (this.config.saveOption === 'none') {
      this.runProcessAfterSave()
    } else if (this.config.saveOption === 'all') {
      this.saveEditors(this.getAllDirtyEditors())
    } else if (this.config.saveOption === 'referenced') {
      this.saveEditors(this.getReferencedDirtyEditors())
    } else {
      this.runProcessAfterSave()
    }
  }


  getAllDirtyEditors() {
    const result = []

    for (let editor of atom.workspace.getTextEditors()) {
      if (this.isEditorDirty(editor)) {
        result.push(editor)
      }
    }

    return result
  }

  getReferencedDirtyEditors() {
    const result = []

    if (this.fields.fileAbsPath.length === 0) {
      return result
    }

    if (!this.commandDependsOnFile()) {
      return result
    }

    const editor = this.getEditorWithPath(this.fields.fileAbsPath)

    if (this.isEditorDirty(editor)) {
      result.push(editor)
    }

    return result
  }

  // Return true of the command to run references either {filePath} or {fileAbsPath}
  commandDependsOnFile() {
    return this.config.command.includes('{filePath}') || this.config.command.includes('{fileAbsPath}')
  }

  isEditorDirty(editor) {
    if ((editor == null)) {
      return false
    }

    return editor.isModified() && (editor.getTitle() !== 'untitled')
  }

  getEditorWithPath(path) {
    const relPath = atom.project.relativizePath(path)[1]

    for (let editor of atom.workspace.getTextEditors()) {
      if (relPath === atom.project.relativizePath(editor.getPath())[1]) {
        return editor
      }
    }

    return null
  }

  saveEditors(editors) {
    if (editors.length === 0) {
      this.runProcessAfterSave()
      return
    }

    let option = 'yes'

    if (this.config.promptToSave) {
      option = this.promptToSave(editors)
    }

    if (option === 'cancel') {
      return
    } else if (option === 'no') {
      this.runProcessAfterSave()
      return
    }

    const promises = editors.map(e => e.save())

    Promise.all(promises).then(results => {
      this.runProcessAfterSave()
    }).catch(error => console.error(error))
  }

  // Prompt to ask if editors should be saved. Return 'yes', 'no' or 'cancel'
  promptToSave(editors) {
    const parts = ['The following files have been modified :\n']
    for (let editor of editors) {
      parts.push(' - ' + editor.getTitle())
    }
    parts.push('\nSave changes before running?')

    const options = {}
    options.message = 'Save Changes'
    options.detailedMessage = parts.join('\n')
    options.buttons = ['Yes', 'No', 'Cancel']

    const choice = atom.confirm(options)
    return options.buttons[choice].toLowerCase()
  }

  runProcessAfterSave() {
    this.takeUserInput(this.config.inputDialogs)
  }

  takeUserInput(inputDialogs) {
    if (!inputDialogs || inputDialogs.length === 0) {
      this.runProcessAfterUserInput()
    } else {
      showUserVariableModal(this.config, inputDialogs, (values) => {
        if (values) {
          this.fields = {
            ...this.fields,
            ...values
          }
          this.runProcessAfterUserInput()
        }
      })
    }
  }

  runProcessAfterUserInput() {
    if (this.config.command.indexOf("selectProjectPath") !== -1) {
      this.takeProjectInput()
    } else {
      this.runProcessAfterProjectInput()
    }
  }

  takeProjectInput() {
    const callback = value => this.projectInputCallback(value)
    showProjectSelectModal(callback, true)
  }

  projectInputCallback(value) {
    if (value != null) {
      this.fields.selectProjectPath = value
    }

    this.runProcessAfterProjectInput()
  }

  runProcessAfterProjectInput() {
    let notifOptions
    if (this.config.cwd) {
      this.options.cwd = this.insertFields(this.config.cwd)
    } else {
      this.options.cwd = this.fields.projectPath
    }

    const command = this.insertFields(this.config.command)

    const args = []
    for (let argument of this.config.arguments) {
      args.push(this.insertFields(argument))
    }

    this.fields.fullCommand = command

    if (args.length > 0) {
      this.fields.fullCommand += " " + args.join(" ")
      this.fields.fullCommand = this.fields.fullCommand.trim()
    }

    this.envBackup = {}
    this.pwdBackup = shelljs.pwd()

    if (this.config.env !== null) {
      for (let key in this.config.env) {
        const val = this.config.env[key]
        this.shell.env[key] = this.insertFields(val)
      }
    }

    if (this.options.cwd) {
      this.options.cwd = this.options.cwd.trim()

      if (this.options.cwd.length > 0) {
        this.shell.cwd = this.options.cwd
      }
    }

    const shellPath = atom.config.get("process-palette.terminal.shell")
    const shellArgs = atom.config.get("process-palette.terminal.shellArguments").split(/\s+/).filter(s => s)

    const onStdOut = (data) => {
      this.stdoutBuffer.push(data)

      if (this.config.stream) {
        this.streamTarget(data)
      }
    }

    const onStdErr = (data) => {
      this.stderrBuffer.push(data)
      if (this.config.stream) {
        this.streamTarget(data)
      }
    }

    const onExit = (exitStatus) => {
      this.fields.exitStatus = exitStatus
      this.processStopped(exitStatus === null)
    }

    let error = null

    try {
      this.process = this.shell.startProcess(shellPath, shellArgs, this.fields.fullCommand, onStdOut, onStdErr, onExit)
    } catch (e) {
      error = e
    }

    if (!this.process) {
      let detail = `Could not execute command '${this.fields.fullCommand}'`

      if (error) {
        detail = `${detail}. ${error.message || error}`
      }

      notifOptions = {}
      notifOptions["dismissable"] = true
      notifOptions["detail"] = detail

      atom.notifications.addWarning(`Error executing ${this.config.namespace}: ${this.config.action}`, notifOptions)
      return
    }

    this.processID = this.process.pid

    if (this.config.notifyOnStart) {
      notifOptions = {}
      notifOptions["detail"] = this.insertFields(this.config.startMessage)
      const messageTitle = 'Running ' + _.humanizeEventName(this.config.getCommandName())
      atom.notifications.addInfo(messageTitle, notifOptions)
    }

    if (this.config.scriptOnStart) {
      this.runScript('start', this.config.startScript)
    }

    if (this.config.input) {
      this.shell.write(this.insertFields(this.config.input))
    }

    this.processStarted()   
  }

  getCwd() {
    return this.options.cwd
  }

  insertFields(text) {
    if (text) {
      text = text.replace(this.replaceRegExp, this.createReplaceCallback())
    }

    return text
  }

  createReplaceCallback() {
    return text => {
      return this.pipeField(text.slice(1, -1))
    }
  }

  pipeField(text) {
    const parts = text.split('|')
    const fieldName = parts[0].trim()
    let value = this.fields[fieldName]

    if ((value == null)) {
      value = ''
    }

    if (parts.length === 2) {
      value = this.pipeValue(value, parts[1].trim())
    }

    return value
  }

  pipeValue(value, filter) {
    if ((filter === 'posix') || (filter === 'unix')) {
      return value.split('\\').join('/')
    } else if (filter === 'win') {
      return value.split('/').join('\\')
    } else if (filter === 'trim') {
      return value.trim()
    }

    return value
  }

  addProcessCallback(callback) {
    this.processCallbacks.push(callback)
  }

  removeProcessCallback(callback) {
    const index = this.processCallbacks.indexOf(callback)

    if (index !== -1) {
      this.processCallbacks.splice(index, 1)
    }
  }

  discard() {
    if (this.shell) {
      this.shell.discard()
    }

    if (!this.process) {
      this.configController.removeProcessController(this)
    }
  }

  killProcess(discard = false) {
    if (!this.process) {
      if (discard) {
        this.discard()
      }

      return
    }

    this.autoDiscard = discard

    if (this.shell) {
      this.shell.killProcess()
    }
  }

  processStarted() {
    this.configController.notifyProcessStarted(this)
    _.invoke(_.clone(this.processCallbacks), "processStarted")
  }

  processStopped(killed) {
    this.process = null
    this.endTime = Date.now()
    this.killed = killed
    this.exitStatus = this.fields.exitStatus
    let output = ""
    const messageTitle = _.humanizeEventName(this.config.getCommandName())
    this.fields.stdout = this.stdoutBuffer.toString()
    this.fields.stderr = this.stderrBuffer.toString()

    this.stdoutBuffer.clear()
    this.stderrBuffer.clear()

    const notifOptions = {}

    if (!killed) {
      if (this.fields.exitStatus === 0) {
        if (this.config.notifyOnSuccess) {
          notifOptions["detail"] = this.insertFields(this.config.successMessage)
          atom.notifications.addSuccess(messageTitle, notifOptions)
        }
        if (this.config.scriptOnSuccess) {
          this.runScript('success', this.config.successScript)
        }
      } else {
        if (this.config.notifyOnError) {
          notifOptions["dismissable"] = true
          notifOptions["detail"] = this.insertFields(this.config.errorMessage)
          atom.notifications.addWarning(messageTitle, notifOptions)
        }
        if (this.config.scriptOnError) {
          this.runScript('error', this.config.errorScript)
        }
      }
    }

    if (!this.config.stream) {
      if (this.fields.exitStatus === 0) {
        if (this.config.successOutput != null) {
          output = this.insertFields(this.config.successOutput)
        }
      } else {
        if (this.config.errorOutput != null) {
          output = this.insertFields(this.config.errorOutput)
        }
      }

      this.outputToTarget(output)
    }

    this.shell.processStopped()

    this.fields = {}

    this.configController.notifyProcessStopped(this)
    _.invoke(_.clone(this.processCallbacks), "processStopped")

    if (this.autoDiscard) {
      this.discard()
    }
  }

  outputToTarget(output) {
    if (this.config.outputTarget === "editor") {
      const editor = atom.workspace.getActiveTextEditor()

      if (editor != null) {
        editor.insertText(output)
      }
    } else if (this.config.outputTarget === "clipboard") {
      atom.clipboard.write(output)
    } else if (this.config.outputTarget === "console") {
      console.log(output)
    } else if (this.config.outputTarget === "panel") {
      this.outputToPanel(output)
    } else if (this.config.outputTarget === "file") {
      this.outputToNewFile(output)
    }
  }

  openNewFile(text) {
    this.creatingNewFile = true

    atom.workspace.open().then(textEditor => {
      this.newFile = textEditor
      this.creatingNewFile = false

      this.newFileDisposable = this.newFile.onDidDestroy(() => {
        this.newFileDestroyed()
      })

      this.outputToNewFile(text)

      // It's possible for the text editor to open only after the process has stopped.
      if (!this.process) {
        this.cleanUpNewFileAfterProcess()
      }
    })
  }

  newFileDestroyed() {
    this.newFile = null

    if (this.newFileDisposable != null) {
      this.newFileDisposable.dispose()
    }

    this.newFileDisposable = null

    if (!this.process) {
      this.configController.removeProcessController(this)
    }
  }

  outputToNewFile(text) {
    if (this.creatingNewFile) {
      return
    }

    if (this.newFile === null) {
      this.openNewFile(text)
    } else {
      this.newFile.insertText(text)
    }
  }

  outputToPanel(text) {
    this.outputView.outputToPanel(text)
  }

  showNewFile() {
    if (this.newFile === null) {
      return
    }

    const pane = atom.workspace.paneForItem(this.newFile)

    if (pane) {
      pane.activateItem(this.newFile)
    }
  }

  runScript(target, script) {
    if ((script == null)) {
      return
    }

    const argNames = []
    const argValues = []

    for (let key in this.fields) {
      const val = this.fields[key]
      argNames.push(key)
      argValues.push(val)
    }

    argNames.push('env')
    argValues.push(shelljs.env)

    try {
      script = atob(script)

      allowUnsafeNewFunction(function () {
        const f = new Function(argNames.join(','), script)
        f.apply(null, argValues)
      })
    } catch (e) {
      const message = "The 'on " + target + "' JavaScript could not be executed. " + e.message
      const warning = `Error executing script for ${this.config.namespace}: ${this.config.action}`

      const notifOptions = {}
      notifOptions["dismissable"] = true
      notifOptions["detail"] = message
      atom.notifications.addWarning(warning, notifOptions)
    }
  }
}

