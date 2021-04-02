/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')

export class SearchAddonView extends View {

  constructor(searchAddon) {
    super(false)
    this.searchAddon = searchAddon
    this.searchText = ''
    this.hide()
  }

  initialize() {
    super.initialize()

    if (this.terminal && this.terminal.element) {
      this.terminal.element.parentElement.appendChild(this.element)
    }
  }

  render() {
    return <div className="process-palette-search-addon" attributes={this.getAttributes()}>
      <input ref="searchInput" class='input-text' type='text' placeholder='Find' on={{ input: () => this.findNext(), keydown: (e) => this.onKeyDown(e), keyup: (e) => this.onKeyUp(e) }}></input>
      <span ref="previousButton" className="process-palette-icon-button icon icon-arrow-up" on={{ click: () => this.findPrevious(), mousedown: e => e.preventDefault() }} />
      <span ref="nextButton" className="process-palette-icon-button icon icon-arrow-down" on={{ click: () => this.findNext(), mousedown: e => e.preventDefault() }} />
      <span ref="hideButton" className="process-palette-icon-button icon icon-x" on={{ click: () => this.hide(), mousedown: e => e.preventDefault() }} />
    </div>
  }

  activate(terminal) {
    this.terminal = terminal

    this.terminal.attachCustomKeyEventHandler(e => {
      if (e.code === 'KeyF') {
        let show = false

        if (process.platform === 'darwin') {
          show = e.metaKey
        } else {
          show = e.ctrlKey
        }

        if (show) {
          this.show()
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      } else if (e.code === 'Escape') {
        if (this.isVisible()) {
          this.hide()
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }

      return true
    })

    this.show()
  }

  onKeyDown(e) {
    if (e.code === 'Escape') {
      if (this.isVisible()) {
        this.hide()
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }

  onKeyUp(e) {
    if (e.code === 'Escape') {
      if (this.isVisible()) {
        this.hide()
        e.preventDefault()
        e.stopPropagation()
      }
    } else if (e.code === 'Enter') {
      if (e.shiftKey) {
        this.findPrevious()
      } else {
        this.findNext()
      }

      e.preventDefault()
      e.stopPropagation()
    }
  }

  findPrevious() {
    this.searchAddon.findPrevious(this.refs.searchInput.value, {
      incremental: false
    })
  }

  findNext() {
    this.searchAddon.findNext(this.refs.searchInput.value, {
      incremental: false
    })
  }

  show() {
    if (!this.terminal || !this.terminal.element) {
      return
    }

    if (!this.initialized) {
      this.initialize()
    }

    super.show()

    this.refs.searchInput.focus()
  }

  hide() {
    super.hide()

    if (this.terminal) {
      this.terminal.focus()
    }
  }

  dispose() {
    this.destroy()
  }

}