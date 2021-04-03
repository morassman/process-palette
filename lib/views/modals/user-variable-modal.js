/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { TextEditor, CompositeDisposable } = require('atom')
const View = require('../view')
const _ = require('underscore-plus')

export default function showUserVariableModal(config, inputDialogs, callback) {
  const view = new UserVariableModal(config, inputDialogs, callback)
  view.open()
}

class UserVariableModal extends View {

  constructor(config, inputDialogs, callback) {
    super(false)
    this.config = config
    this.inputDialogs = inputDialogs
    this.callback = callback
    this.disposables = new CompositeDisposable()

    this.initialize()
  }

  render() {
    const rows = []

    for (let i = 0; i < this.inputDialogs.length; i++) {
      const id = this.inputDialogs[i]
      let row = <tr>
        <td className="text-highlight">{id.variableName}</td>
        <td><TextEditor ref={`${i}`} mini={true} /></td>
      </tr>

      rows.push(row)

      if (id.message && id.message.length > 0) {
        row = <tr>
          <td></td>
          <td className="process-palette-input-dialog-message">{id.message}</td>
        </tr>

        rows.push(row)
      }
    }

    return <div className="process-palette-input-dialog">
      <div className="process-palette-input-dialog-header">
        {_.humanizeEventName(`${this.config.namespace}:${this.config.action}`)}
      </div>
      <table>
        <colgroup>
          <col style="width: 30%;" />
          <col style="width: 70%;" />
        </colgroup>
        <thead>
          <th>Name</th>
          <th>Value</th>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
      <div className="process-palette-input-dialog-footer">
        <div />
        <button className="btn" on={{ click: () => this.cancel() }}>Cancel</button>
        <button className="btn btn-primary" on={{ click: () => this.confirm() }}>OK</button>
        <div />
      </div>
    </div>
  }

  initialize() {
    super.initialize()

    for (let i = 0; i < this.inputDialogs.length; i++) {
      const id = this.inputDialogs[i]
      const editor = this.refs[`${i}`]
      editor.element.setAttribute('tabindex', i + 1)
      editor.setText(id.initialInput || '')
    }

    this.disposables.add(atom.commands.add(this.element, 'core:confirm', () => this.confirm()))
    this.disposables.add(atom.commands.add(this.element, 'core:cancel', () => this.cancel()))
  }

  open() {
    this.panel = atom.workspace.addModalPanel({ item: this, visible: true, autoFocus: true })
    // Focus the first editor.
    this.refs["0"].element.focus()
  }

  close() {
    this.disposables.dispose()

    if (this.panel) {
      this.panel.destroy()
    }
  }

  cancel() {
    this.callback(null)
    this.close()
  }

  confirm() {
    const values = {}

    for (let i = 0; i < this.inputDialogs.length; i++) {
      const id = this.inputDialogs[i]
      const editor = this.refs[`${i}`]
      values[id.variableName] = editor.getText()
    }

    this.callback(values)
    this.close()
  }

}
