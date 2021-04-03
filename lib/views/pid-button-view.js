/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable } = require('atom')
const View = require('./view')

export default class PIDButtonView extends View {

  constructor(configController, processController) {
    super(false)
    this.configController = configController
    this.processController = processController
    this.tooltipDisposables = null

    this.processController.addProcessCallback(this)

    this.initialize()
  }

  render() {
    return <div className="process-palette-pid-btn">
      <button ref="killButton" className="process-palette-pid-btn-x btn btn-sm btn-fw icon-primitive-square" on={{ click: () => this.killButtonPressed(), mousedown: e => e.preventDefault() }} />
      <button ref="showOutputButton" className="process-palette-pid-btn-pid btn btn-sm" on={{ click: () => this.showOutputButtonPressed(), mousedown: e => e.preventDefault() }}>
        {this.processController.getProcessID()}
      </button>
    </div>
  }

  initialize() {
    super.initialize()

    if (this.processController.process === null) {
      this.showTrashIcon()
    }

    this.addTooltips()
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
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.killButton, { title: "Kill/Discard" }))
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.showOutputButton, { title: "Show Output" }))
  }

  removeTooltips() {
    if (this.tooltipDisposables) {
      this.tooltipDisposables.dispose()
      this.tooltipDisposables = null
    }
  }

  destroy() {
    this.tooltipDisposables.dispose()
    this.processController.removeProcessCallback(this)
    super.destroy()
  }

  getElement() {
    return this.element
  }

  processStarted() { }

  processStopped() {
    this.showTrashIcon()
  }

  showTrashIcon() {
    this.refs.killButton.classList.remove('icon-primitive-square')
    this.refs.killButton.classList.add('icon-x')
  }

  killButtonPressed() {
    if (this.processController.process !== null) {
      this.processController.killProcess(false)
    } else {
      this.processController.discard()
    }

    this.refreshTooltips()
  }

  showOutputButtonPressed() {
    if (this.isHighlighted()) {
      return
    }

    this.processController.showProcessOutput()
    this.refreshTooltips()
  }

  highlight() {
    this.refs.showOutputButton.classList.add("btn-primary", "selected")
  }

  isHighlighted() {
    return this.refs.showOutputButton.classList.contains("selected")
  }
}
