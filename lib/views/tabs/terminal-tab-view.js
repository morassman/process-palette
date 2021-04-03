/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable } = require('atom')
const TabView = require('./tab-view')
const View = require('../view')
const { spawn } = require('node-pty-prebuilt-multiarch')
const { Terminal } = require('xterm')
const { FitAddon } = require('xterm-addon-fit')
const { SearchAddon } = require('xterm-addon-search')
const { SearchAddonView } = require('../search-addon-view')

class TerminalTabContentView extends View {

  constructor(mainView, cwd, env, onExit) {
    super(false)
    this.mainView = mainView
    this.cwd = cwd
    this.env = env
    this.onExit = onExit
    this.process = null
    this.tabView = null
    this.tooltipDisposables = null

    let fontSize = atom.config.get('process-palette.outputPanel.fontSize')

    if (!fontSize) {
      fontSize = 12
    }

    this.xterm = new Terminal({
      cursorBlink: false,
      cursorStyle: 'underline',
      fontSize: fontSize
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
          <button ref="findButton" className="btn btn-sm btn-fw icon-search" on={{ click: () => this.find(), mousedown: e => e.preventDefault() }} />
          <button ref="copyButton" className="btn btn-sm btn-fw icon-versions" on={{ click: () => this.copy(), mousedown: e => e.preventDefault() }} />
          <button ref="pasteButton" className="btn btn-sm btn-fw icon-clippy" on={{ click: () => this.paste(), mousedown: e => e.preventDefault() }} />
          <button ref="clearButton" className="btn btn-sm btn-fw icon-trashcan" on={{ click: () => this.clear(), mousedown: e => e.preventDefault() }} />
        </span>
      </div>
      <div ref="outputPanel" className="process-palette-terminal-output" />
    </div>
  }

  initialize() {
    super.initialize()
    this.addTooltips()
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
    const shellPath = atom.config.get("process-palette.shell")
    const shellArgs = atom.config.get("process-palette.shellArguments").split(" ")

    try {
      this.process = spawn(shellPath, shellArgs, {
        name: 'xterm-256color',
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