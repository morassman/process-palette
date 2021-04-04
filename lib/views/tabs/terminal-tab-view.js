/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable } = require('atom')
const TabView = require('./tab-view')
const View = require('../view')
const showChooseVariableModal = require('../modals/choose-variable-modal')
const { spawn } = require('node-pty-prebuilt-multiarch')
const { Terminal } = require('xterm')
const { FitAddon } = require('xterm-addon-fit')
const { SearchAddon } = require('xterm-addon-search')
const { SearchAddonView } = require('../search-addon-view')
const { getFieldsForTerminal } = require('../../utils')

class TerminalTabContentView extends View {

  constructor(mainView, cwd, env, onExit) {
    super(false)
    this.mainView = mainView
    this.cwd = cwd
    this.env = env
    this.onExit = onExit
    this.process = null
    this.tabView = null
    this.disposables = new CompositeDisposable()
    this.tooltipDisposables = null

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

    this.fitAddon = new FitAddon()
    this.searchAddon = new SearchAddon()
    this.searchAddonView = new SearchAddonView(this.searchAddon)
    this.xterm.loadAddon(this.searchAddon)
    this.xterm.loadAddon(this.searchAddonView)
    this.xterm.loadAddon(this.fitAddon)

    this.resizeObserver = new ResizeObserver(() => this.fit())
    this.resizeObserver.observe(this.mainView.element)

    this.initialize()
  }

  render() {
    return <div className="process-palette-terminal">
      <div ref="toolbar" className="process-palette-terminal-toolbar">
        <div className="process-palette-terminal-toolbar-title">
        </div>
        <span className="process-palette-terminal-toolbar-buttons btn-toolbar">
          <button ref="findButton" className="btn btn-sm btn-fw icon icon-search" on={{ click: () => this.find(), mousedown: e => e.preventDefault() }} />
          <button ref="insertVariableButton" className="btn btn-sm btn-fw icon icon-code" on={{ click: () => this.insertVariable(), mousedown: e => e.preventDefault() }} />
          <button ref="copyButton" className="btn btn-sm btn-fw icon icon-versions" on={{ click: () => this.copy(), mousedown: e => e.preventDefault() }} />
          <button ref="pasteButton" className="btn btn-sm btn-fw icon icon-clippy" on={{ click: () => this.paste(), mousedown: e => e.preventDefault() }} />
          <button ref="clearButton" className="btn btn-sm btn-fw icon icon-trashcan" on={{ click: () => this.clear(), mousedown: e => e.preventDefault() }} />
        </span>
      </div>
      <div ref="outputPanel" className="process-palette-terminal-output" />
    </div>
  }

  initialize() {
    super.initialize()
    this.addTooltips()

    this.disposables.add(atom.commands.add(this.element, "core:copy", () => this.copy()))
    this.disposables.add(atom.commands.add(this.element, "core:paste", () => this.paste()))
    this.disposables.add(atom.contextMenu.add({
      ".process-palette-terminal-output": [{
        label: "Copy",
        command: "core:copy"
      }, {
        label: "Paste",
        command: "core:paste",
        visible: this.isTerminal
      }]
    }))

    this.startProcess()
  }

  refreshTooltips() {
    this.removeTooltips()
    this.addTooltips()
  }

  addTooltips() {
    if (this.tooltipDisposables) {
      return
    }

    this.tooltipDisposables = new CompositeDisposable()
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.insertVariableButton, { title: 'Insert Variable' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.findButton, { title: 'Find' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.copyButton, { title: 'Copy' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.pasteButton, { title: 'Paste' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.clearButton, { title: 'Clear Output' }))
  }

  removeTooltips() {
    if (this.tooltipDisposables) {
      this.tooltipDisposables.dispose()
      this.tooltipDisposables = null
    }
  }

  startProcess() {
    const shellPath = atom.config.get("process-palette.terminal.shell")
    const shellArgs = atom.config.get("process-palette.terminal.shellArguments").split(/\s+/).filter(s => s)
    const name = atom.config.get("process-palette.terminal.type")

    try {
      this.process = spawn(shellPath, shellArgs, {
        name,
        cols: 80,
        rows: 40,
        cwd: this.cwd,
        env: this.env
      })
    } catch (err) {
      this.refs.outputPanel.classList.add('text-error')
      this.refs.outputPanel.innerHTML = err
      this.refs.toolbar.remove()
      return
    }

    this.process.onData((data) => this.xterm.write(data))
    this.process.onExit(() => {
      this.process = null
      this.onExit()
    })

    this.xterm.onData(data => {
      if (this.process) {
        this.process.write(data)
      }
    })

    this.xterm.open(this.refs.outputPanel)
    this.fit()
  }

  insertVariable() {
    const vars = ['fileExt', 'fileName', 'fileNameExt', 'filePath', 'fileDirPath', 'fileAbsPath', 'fileDirAbsPath', 'fileProjectPath', 'clipboard', 'selection', 'word', 'token', 'line', 'lineNo', 'projectPath']
    showChooseVariableModal((name) => {
      if (name) {
        const values = getFieldsForTerminal()
        const value = values[name]
        if (value) {
          this.xterm.paste(value)
        }
      }
      this.xterm.focus()
    }, vars)
  }

  contentShown() {
    setTimeout(() => {
      this.fit()
      this.focus()
    }, 500)
  }

  kill() {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
  }

  fit() {
    try {
      this.fitAddon.fit()

      if (this.process) {
        this.process.resize(this.xterm.cols, this.xterm.rows)
      }
    } catch (err) {
    }
  }

  focus() {
    this.xterm.focus()
  }

  find() {
    this.searchAddonView.toggle()
  }

  copy() {
    atom.clipboard.write(this.xterm.getSelection())
  }

  paste() {
    this.xterm.paste(atom.clipboard.read())
  }

  clear() {
    this.xterm.clear()
    // this.xterm.reset()
  }

  destroy() {
    this.removeTooltips()
    this.xterm.dispose()
    this.resizeObserver.disconnect()
    super.destroy()
  }
}

export default class TerminalTabView extends TabView {

  constructor(mainView, title, cwd, env) {
    super(true, 'terminal', title, new TerminalTabContentView(mainView, cwd, env, () => this.onExit()))
    this.content.tabView = this
  }

  contentShown() {
    this.content.contentShown()
  }

  onExit() {
    super.close()
  }

  close() {
    if (this.content.process) {
      this.content.kill()
    } else {
      super.close()
    }
  }

}