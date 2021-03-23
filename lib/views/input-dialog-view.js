/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { TextEditor, CompositeDisposable } = require('atom')
const View = require('./view')

export default function showInputDialog(message, initialInput, confirmFunc) {
  const view = new InputDialogView(message, initialInput, confirmFunc)
  view.open()
}

class InputDialogView extends View {

  constructor(message, initialInput, confirmFunc) {
    super(false)
    this.message = message
    this.initialInput = initialInput
    this.confirmFunc = confirmFunc
    this.disposables = new CompositeDisposable()

    this.initialize()
  }

  render() {
    return <div className="input-dialog">
      <div className="message">{this.message}</div>
      <TextEditor ref="editor" mini={true} />
    </div>
  }

  initialize() {
    super.initialize()

    this.refs.editor.setText(this.initialInput)
    this.refs.editor.element.addEventListener('blur', () => this.close())

    this.disposables.add(atom.commands.add(this.refs.editor.element, 'core:confirm', () => this.confirm()))
    this.disposables.add(atom.commands.add(this.refs.editor.element, 'core:cancel', () => this.close()))
  }

  open() {
    this.panel = atom.workspace.addModalPanel({ item: this, visible: true, autoFocus: true })
    this.refs.editor.element.focus()
  }

  close() {
    this.disposables.dispose()

    if (this.panel) {
      this.panel.destroy()
    }
  }

  confirm() {
    this.confirmFunc(this.refs.editor.getText())
    this.close();
  }

}
