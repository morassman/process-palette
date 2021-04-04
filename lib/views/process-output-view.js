/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const _ = require('underscore-plus')
const { CompositeDisposable } = require('atom')
const PIDButtonsView = require('./pid-buttons-view')
const { PathView } = require('./path-view')
const { resolvePatternPath } = require('./path-view')
const escapeHTML = require('underscore.string/escapeHTML')
const AnsiToHtml = require('ansi-to-html')
const { FitAddon } = require('xterm-addon-fit')
const { SearchAddon } = require('xterm-addon-search')
const { SearchAddonView } = require('./search-addon-view')

class OutputView extends View {

  constructor(parent) {
    super(false)
    this.parent = parent
    this.main = parent.main
    this.processController = parent.processController
    this.patterns = this.processController.configController.patterns
    this.cwd = this.processController.shell.cwd

    this.fontSize = atom.config.get('process-palette.fontSize')

    if (!this.fontSize) {
      this.fontSize = 12
    }
  }

  contentShown() {
  }

  processStarted() {
  }

  streamOutput(data) {
  }

  outputToPanel(data) {
  }

  find() {
  }

  copy() {
  }

  paste() {
  }

  clear() {
  }

}

class PanelOutputView extends OutputView {

  constructor(parent) {
    super(parent)
    this.lastScrollTop = 0;
    this.ansiConvert = new AnsiToHtml({ stream: true })

    this.initialize()
  }

  render() {
    const fontFamily = atom.config.get('process-palette.fontFamily')

    const outputPanelAttributes = {
      style: `font-family: ${fontFamily}; font-size: ${this.fontSize}px`,
      tabindex: 0
    }

    return <div ref="outputPanel" className="process-palette-panel-output native-key-bindings" attributes={outputPanelAttributes}
      on={{ mousedown: () => this.onOutputPanelMouseDown(), scroll: () => this.onOutputPanelScroll(), mousewheel: e => this.onOutputPanelMouseWheel(e) }} />
  }

  onOutputPanelMouseDown() {
    // Only do this while the process is running.
    if (this.processController.process) {
      this.parent.setScrollLockEnabled(true)
    }
  }

  onOutputPanelScroll() {
    this.lastScrollTop = this.refs.outputPanel.scrollTop
  }

  onOutputPanelMouseWheel(e) {
    if (!this.processController.process) {
      return
    }

    const delta = e.deltaY

    if (delta < 0) {
      this.parent.setScrollLockEnabled(true)
    } else if (delta > 0) {
      this.disableScrollLockIfAtBottom()
    }
  }

  disableScrollLockIfAtBottom() {
    if ((this.refs.outputPanel.clientHeight + this.refs.outputPanel.scrollTop) === this.refs.outputPanel.scrollHeight) {
      if (this.refs.outputPanel.scrollTop > 0) {
        this.parent.setScrollLockEnabled(false)
      }
    }
  }

  processStarted() {
  }

  streamOutput(data) {
    this.outputToPanel(data)
  }

  outputToPanel(data) {
    data = this.sanitizeOutput(data)
    let addNewLine = false

    data.split(/\r?\n/).forEach(line => {
      if (addNewLine) {
        this.refs.outputPanel.appendChild(document.createElement("br"))
      }

      this.appendLine(line)
      addNewLine = true
    })
  }

  appendLine(line) {
    for (let pattern of this.patterns) {
      const match = pattern.match(line)

      if (match != null) {
        const cwd = this.processController.getCwd()
        const pathView = new PathView(cwd, match)

        if (pathView.pathExists()) {
          this.refs.outputPanel.insertAdjacentHTML("beforeend", match.pre)
          this.refs.outputPanel.append(pathView.element)
          this.refs.outputPanel.insertAdjacentHTML("beforeend", match.post)
          return
        }
      }
    }

    this.refs.outputPanel.insertAdjacentHTML("beforeend", line)
  }

  sanitizeOutput(output) {
    // Prevent HTML in output from being parsed as HTML
    output = escapeHTML(output)

    // Convert ANSI escape sequences (ex. colors) to HTML
    return this.ansiConvert.toHtml(output)
  }

  outputChanged() {
    if (this.parent.scrollLocked) {
      this.refs.outputPanel.scrollTop = this.lastScrollTop
    } else {
      this.refs.outputPanel.scrollTop = this.refs.outputPanel.scrollHeight - this.refs.outputPanel.clientHeight
    }

    this.parent.refreshScrollLockButton()
  }

  copy() {
    atom.clipboard.write(window.getSelection().toString())
  }

  clear() {
    this.lastScrollTop = 0
    this.refs.outputPanel.innerHTML = ""
    this.outputChanged();
  }

}

class TerminalOutputView extends OutputView {

  constructor(parent) {
    super(parent)

    this.xterm = this.processController.shell.xterm

    if (this.xterm) {
      this.fitAddon = new FitAddon()
      this.searchAddon = new SearchAddon()
      this.searchAddonView = new SearchAddonView(this.searchAddon)
      this.xterm.loadAddon(this.searchAddon)
      this.xterm.loadAddon(this.searchAddonView)
      this.xterm.loadAddon(this.fitAddon)
      this.registerPatterns()
    }

    this.resizeObserver = new ResizeObserver(() => this.fit())
    this.resizeObserver.observe(this.main.mainView.element)

    this.initialize()
  }

  registerPatterns() {
    if (!this.patterns) {
      return
    }

    for (const pattern of this.patterns) {
      this.xterm.registerLinkMatcher(pattern.regex, (e, uri) => {
        atom.workspace.open(uri)
      }, {
        matchIndex: pattern.config.pathIndex,
        validationCallback: (uri, callback) => {
          const path = resolvePatternPath(this.cwd, uri)
          callback(path ? true : false)
        }
      })
    }
  }

  initialize() {
    super.initialize()

    if (this.xterm) {
      this.xterm.open(this.refs.outputPanel)
      this.fit()
      // this.searchAddonView.show()
    }
  }

  render() {
    return <div ref="outputPanel" className="process-palette-terminal-output" />
  }

  contentShown() {
    if (this.xterm) {
      setTimeout(() => {
        this.fit()
        this.xterm.focus()
      }, 1)
    }
  }

  processStarted() {
  }

  streamOutput(data) {
  }

  outputToPanel(data) {
  }

  outputChanged() {
    this.fit()
  }

  find() {
    this.searchAddonView.toggle()
  }

  fit() {
    if (this.fitAddon) {
      try {
        this.fitAddon.fit()
        this.processController.shell.fit()
      } catch (err) {
      }
    }
  }

  copy() {
    if (this.xterm) {
      atom.clipboard.write(this.xterm.getSelection())
    }
  }

  paste() {
    if (this.xterm) {
      this.xterm.paste(atom.clipboard.read())
    }
  }

  clear() {
    if (this.xterm) {
      this.xterm.clear()
    }
  }

  destroy() {
    this.resizeObserver.disconnect()
    super.destroy()
  }

}

export default class ProcessOutputView extends View {

  constructor(main, processController, outputTarget) {
    super(false)
    this.main = main
    this.processController = processController
    this.disposables = new CompositeDisposable()
    this.tooltipDisposables = null
    this.scrollLocked = false
    this.isTerminal = outputTarget === 'terminal'

    if (this.isTerminal) {
      this.outputView = new TerminalOutputView(this)
    } else {
      this.outputView = new PanelOutputView(this)
    }

    this.initialize()
  }

  render() {
    return <div ref="processOutputView" className="process-palette-process-output-view">
      <div className="process-palette-process-view process-palette-process-view-output">
        <div className="process-palette-process-view-toolbar">
          <button ref="runButton" className="btn btn-sm btn-fw icon-playback-play inline-block-tight" on={{ click: () => this.runButtonPressed(), mousedown: e => e.preventDefault() }} />
          {this.processController.config.keystroke &&
            <span ref="keystroke" className="process-palette-process-view-keystroke inline-block">
              {_.humanizeKeystroke(this.processController.config.keystroke)}
            </span>}
          <PIDButtonsView ref="buttonsView" configController={this.processController.configController} parentProcessController={this.processController} />
          <span className="btn-toolbar">
            <button ref="findButton" className="btn btn-sm btn-fw icon-search" on={{ click: () => this.outputView.find(), mousedown: e => e.preventDefault() }} />
            <button ref="copyButton" className="btn btn-sm btn-fw icon-versions" on={{ click: () => this.outputView.copy(), mousedown: e => e.preventDefault() }} />
            <button ref="pasteButton" className="btn btn-sm btn-fw icon-clippy" on={{ click: () => this.outputView.paste(), mousedown: e => e.preventDefault() }} />
            <button ref="scrollLockButton" className="btn btn-sm btn-fw icon-lock" on={{ click: () => this.toggleScrollLock(), mousedown: e => e.preventDefault() }} />
            <button ref="clearButton" className="btn btn-sm btn-fw icon-trashcan" on={{ click: () => this.outputView.clear(), mousedown: e => e.preventDefault() }} />
          </span>
        </div>
      </div>
    </div>
  }

  initialize() {
    super.initialize()

    this.outputPanel = this.outputView.element
    this.refs.processOutputView.appendChild(this.outputPanel)

    this.addTooltips()

    if (this.processController.config.scrollLockEnabled) {
      this.setScrollLockEnabled(true)
    } else {
      this.refreshScrollLockButton()
    }

    if (this.isTerminal) {
      // The terminal does not support scroll lock.
      this.refs.scrollLockButton.remove()
    } else {
      // The panel does not support find and paste.
      this.refs.findButton.remove()
      this.refs.pasteButton.remove()
    }

    this.processController.addProcessCallback(this)

    // Override the copy/paste shortcuts.
    this.disposables.add(atom.commands.add(this.element, "core:copy", () => this.outputView.copy()))
    this.disposables.add(atom.commands.add(this.element, "core:paste", () => this.outputView.paste()))

    const ctxMenuSelector = this.isTerminal ? ".process-palette-terminal-output" : ".process-palette-panel-output"

    this.disposables.add(atom.contextMenu.add({
      [ctxMenuSelector]: [{
        label: "Copy",
        command: "core:copy"
      }, {
        label: "Paste",
        command: "core:paste",
        visible: this.isTerminal
      }]
    }))

    this.outputChanged()
  }

  contentShown() {
    this.outputView.contentShown()
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
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.runButton, { title: 'Run Process' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.findButton, { title: 'Find' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.copyButton, { title: 'Copy' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.pasteButton, { title: 'Paste' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.scrollLockButton, { title: 'Scroll Lock' }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.clearButton, { title: 'Clear Output' }))
  }

  removeTooltips() {
    if (this.tooltipDisposables) {
      this.tooltipDisposables.dispose()
      this.tooltipDisposables = null
    }
  }

  attached() {
    this.outputChanged();
  }

  show() {
    super.show();
    this.outputChanged();
  }

  processStarted() {
    this.outputView.processStarted()
  }

  processStopped() {}

  setScrollLockEnabled(enabled) {
    if (this.scrollLocked === enabled) {
      return
    }

    this.scrollLocked = enabled;
    this.refreshScrollLockButton();
  }

  showListView() {
    this.main.showListView();
  }

  runButtonPressed() {
    this.processController.configController.runProcess()
    this.refreshTooltips()
  }

  toggleScrollLock() {
    this.setScrollLockEnabled(!this.scrollLocked);
  }

  refreshScrollLockButton() {
    this.refs.scrollLockButton.classList.remove("btn-warning");

    if (this.scrollLocked) {
      this.refs.scrollLockButton.classList.add("btn-warning");
    }
  }

  outputChanged() {
    this.outputView.outputChanged()
  }

  streamOutput(data) {
    this.outputView.streamOutput(data)
    this.outputChanged()
  }

  outputToPanel(text) {
    this.outputView.outputToPanel(text)
    this.outputChanged();
  }

  // Tear down any state and remove
  destroy() {
    this.removeTooltips()

    if (this.processController) {
      this.processController.removeProcessCallback(this);
    }

    this.disposables.dispose()
    this.refs.buttonsView.destroy();
    this.outputView.destroy()
    super.destroy()
  }

  getElement() {
    return this.element;
  }

}
