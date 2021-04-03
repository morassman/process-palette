/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const { CompositeDisposable } = require('atom')

export class SearchAddonView extends View {

  constructor(searchAddon) {
    super(false)
    this.searchAddon = searchAddon
    this.searchText = ''
    this.caseSensitive = false
    this.wholeWord = false
    this.regex = false
    this.disposables = new CompositeDisposable()
    this.hide()
  }

  initialize() {
    super.initialize()

    if (this.terminal && this.terminal.element) {
      this.terminal.element.parentElement.appendChild(this.element)
    }

    this.disposables.add(atom.tooltips.add(this.refs.matchCaseButton, { title: "Match Case" }))
    this.disposables.add(atom.tooltips.add(this.refs.matchWordButton, { title: "Match Whole Word" }))
    this.disposables.add(atom.tooltips.add(this.refs.matchRegExButton, { title: "Match Regular Expression" }))
  }

  render() {
    return <div className="process-palette-search-addon" attributes={this.getAttributes()}>
      <div className="process-palette-search-addon-input">
        <input ref="searchInput" className='input-text native-key-bindings' type='text' placeholder='Find' on={{ input: () => this.find(), keydown: (e) => this.onKeyDown(e), keyup: (e) => this.onKeyUp(e) }}></input>
        <span ref="matchCaseButton" className="process-palette-search-addon-input-btn" on={{ click: () => this.toggleMatchCase() }}>Aa</span>
        <span ref="matchWordButton" className="process-palette-search-addon-input-btn process-palette-search-addon-input-btn-word" on={{ click: () => this.toggleMatchWord() }}>Abl</span>
        <span ref="matchRegExButton" className="process-palette-search-addon-input-btn" on={{ click: () => this.toggleMatchRegEx() }}>.*</span>
      </div>
      <span ref="previousButton" className="process-palette-icon-button icon icon-arrow-up" on={{ click: () => this.findPrevious(), mousedown: e => e.preventDefault() }} />
      <span ref="nextButton" className="process-palette-icon-button icon icon-arrow-down" on={{ click: () => this.findNext(), mousedown: e => e.preventDefault() }} />
      <span ref="hideButton" className="process-palette-icon-button icon icon-x" on={{ click: () => this.hide(), mousedown: e => e.preventDefault() }} />
    </div>
  }

  toggleButton(checked, element) {
    if (checked) {
      element.classList.remove('process-palette-search-addon-input-btn-checked')
    } else {
      element.classList.add('process-palette-search-addon-input-btn-checked')
    }

    return !checked
  }

  toggleMatchCase() {
    this.caseSensitive = this.toggleButton(this.caseSensitive, this.refs.matchCaseButton)
    this.find()
  }

  toggleMatchWord() {
    this.wholeWord = this.toggleButton(this.wholeWord, this.refs.matchWordButton)
    this.find()
  }

  toggleMatchRegEx() {
    this.regex = this.toggleButton(this.regex, this.refs.matchRegExButton)
    this.find()
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

  find() {
    this.searchAddon.findNext(this.refs.searchInput.value, {
      incremental: true,
      regex: this.regex,
      wholeWord: this.wholeWord,
      caseSensitive: this.caseSensitive
    })
  }

  findPrevious() {
    this.searchAddon.findPrevious(this.refs.searchInput.value, {
      incremental: false,
      regex: this.regex,
      wholeWord: this.wholeWord,
      caseSensitive: this.caseSensitive
    })
  }

  findNext() {
    this.searchAddon.findNext(this.refs.searchInput.value, {
      incremental: false,
      regex: this.regex,
      wholeWord: this.wholeWord,
      caseSensitive: this.caseSensitive
    })
  }

  toggle() {
    if (!this.initialized || this.isHidden()) {
      this.show()
    } else {
      this.hide()
    }
  }

  show() {
    if (!this.terminal || !this.terminal.element) {
      return
    }

    if (!this.initialized) {
      this.initialize()
    }

    super.show()

    setTimeout(() => this.refs.searchInput.focus(), 1)
  }

  hide() {
    super.hide()

    if (this.terminal) {
      this.terminal.focus()
    }
  }

  dispose() {
    this.disposables.dispose()
    this.destroy()
  }

}