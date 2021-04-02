/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const { CompositeDisposable } = require('atom')

export default class MainButtonsView extends View {

  constructor({ mainView }) {
    super(false)
    this.mainView = mainView
    this.disposables = null
    this.initialize()
  }

  initialize() {
    super.initialize()
    this.refs.saveButton.style.visibility = 'hidden'
    this.addTooltips()
  }

  render() {
    return <div className="process-palette-main-buttons">
      <button className="btn btn-sm btn-fw btn-info inline-block-tight" ref="saveButton" on={{ click: () => this.mainView.savePressed(), mousedown: e => e.preventDefault() }}>Save</button>
      <button className="btn btn-xs btn-fw icon-terminal inline-block-tight" ref="terminalButton" on={{ click: () => this.mainView.addTerminal(), mousedown: e => e.preventDefault() }} />
      <button className="btn btn-xs btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: () => this.mainView.editPressed(), mousedown: e => e.preventDefault() }} />
      <button className="btn btn-xs btn-fw icon-sync inline-block-tight" ref="reloadButton" on={{ click: () => this.mainView.reloadPressed(), mousedown: e => e.preventDefault() }} />
      <button className="btn btn-xs btn-fw icon-gear inline-block-tight" ref="settingsButton" on={{ click: () => this.mainView.settingsPressed(), mousedown: e => e.preventDefault() }} />
      <button className="btn btn-xs btn-fw icon-question inline-block-tight" ref="helpButton" on={{ click: () => this.mainView.toggleHelpView(), mousedown: e => e.preventDefault() }} />
    </div>
  }

  highlightHelpButton() {
    this.refs.helpButton.classList.add("btn-info")
  }

  setSaveButtonVisible(visible) {
    this.refs.saveButton.style.visibility = visible ? 'visible' : 'hidden'
  }

  show() {
    super.show()
    this.addTooltips()
  }

  hide() {
    super.hide()
    this.removeTooltips()
  }

  addTooltips() {
    if (this.disposables) {
      return
    }

    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.tooltips.add(this.refs.saveButton, { title: "Save changes" }))
    this.disposables.add(atom.tooltips.add(this.refs.terminalButton, { title: "Add terminal" }))
    this.disposables.add(atom.tooltips.add(this.refs.editButton, { title: "Edit configuration" }))
    this.disposables.add(atom.tooltips.add(this.refs.reloadButton, { title: "Reload configurations" }))
    this.disposables.add(atom.tooltips.add(this.refs.settingsButton, { title: "Settings" }))
    this.disposables.add(atom.tooltips.add(this.refs.helpButton, { title: "Toggle help" }))
  }

  removeTooltips() {
    if (this.disposables) {
      this.disposables.dispose()
      this.disposables = null
    }
  }

  remove() {
    this.removeTooltips()
    super.remove()
  }

}