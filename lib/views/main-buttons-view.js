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
      <div className="process-palette-add-terminal-btn inline-block-tight">
        <button className="process-palette-add-terminal-btn-default btn btn-xs btn-fw icon-terminal" ref="terminalButton" on={{ click: () => this.mainView.addTerminal(), mousedown: e => e.preventDefault() }} />
        <button className="process-palette-add-terminal-btn-custom btn btn-xs icon-gear" ref="customTerminalButton" on={{ click: () => this.mainView.addCustomTerminal(), mousedown: e => e.preventDefault() }} />
      </div>
      <button className="btn btn-xs btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: () => this.mainView.editPressed(), mousedown: e => e.preventDefault() }} />
      <button className="btn btn-xs btn-fw icon-sync inline-block-tight" ref="reloadButton" on={{ click: () => this.mainView.reloadPressed(), mousedown: e => e.preventDefault() }} />
      <button className="btn btn-xs btn-fw icon-tools inline-block-tight" ref="settingsButton" on={{ click: () => this.mainView.settingsPressed(), mousedown: e => e.preventDefault() }} />
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
    this.disposables.add(atom.tooltips.add(this.refs.saveButton, { title: "Save Changes" }))
    this.disposables.add(atom.tooltips.add(this.refs.terminalButton, { title: "Add Terminal" }))
    this.disposables.add(atom.tooltips.add(this.refs.customTerminalButton, { title: "Add Custom Terminal" }))
    this.disposables.add(atom.tooltips.add(this.refs.editButton, { title: "Edit Configuration" }))
    this.disposables.add(atom.tooltips.add(this.refs.reloadButton, { title: "Reload Configurations" }))
    this.disposables.add(atom.tooltips.add(this.refs.settingsButton, { title: "Settings" }))
    this.disposables.add(atom.tooltips.add(this.refs.helpButton, { title: "Toggle Help" }))
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