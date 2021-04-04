/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable, Directory } = require('atom')
const View = require('../view')
const os = require('os')
const TableEditView = require('../edit/table-edit-view')
const fsp = require('fs-plus')

export default function showCustomTerminalModal(mainView) {
  const view = new CustomTerminalModal(mainView)
  view.open()
}

// Remember the previous custor CWD.
let cwdCustom = process.cwd()

class CustomTerminalModal extends View {

  constructor(mainView) {
    super(false)
    this.mainView = mainView
    this.disposables = new CompositeDisposable()
    this.cwdCurrent = process.cwd()
    this.cwdHome = os.homedir()
    this.projects = []
    // Name of selected cwd radio button.
    this.selectedCwd = 'cwdHome'

    for (let path of atom.project.getPaths()) {
      const dir = new Directory(path)
      this.projects.push({
        name: dir.getBaseName(),
        path
      })
    }

    this.initialize()
  }

  initialize() {
    super.initialize()

    this.refs.cwdCustomEditor.value = cwdCustom
    this.refs.tabTitleEditor.value = 'Terminal'

    const varNames = Object.keys(process.env)
    varNames.sort()

    varNames.forEach(varName => {
      this.refs.envVarsView.addRow([varName, process.env[varName]])
    })

    this.refreshSelectedCwd()

    this.disposables.add(atom.commands.add(this.element, 'core:confirm', () => this.confirm()))
    this.disposables.add(atom.commands.add(this.element, 'core:cancel', () => this.cancel()))
  }

  selectCwd(name) {
    this.selectedCwd = name
    this.refreshSelectedCwd()
  }

  refreshSelectedCwd() {
    Object.keys(this.refs).forEach(name => {
      if (name.startsWith('cwd')) {
        this.refs[name].checked = name === this.selectedCwd
      }
    })
  }

  renderWorkingDirectory() {
    return <table className="process-palette-custom-terminal-cwd">
      <tbody>
        <tr on={{ click: () => this.selectCwd('cwdCustom') }}>
          <td>
            <label className='input-label'><input ref="cwdCustom" className='input-radio' type='radio' />Custom</label>
          </td>
          <td>
            <input ref="cwdCustomEditor" className='process-palette-input input-text native-key-bindings' type='text' />
          </td>
        </tr>
        <tr on={{ click: () => this.selectCwd('cwdCurrent') }}>
          <td>
            <label className='input-label'><input ref="cwdCurrent" className='input-radio' type='radio' />Current</label>
          </td>
          <td>{this.cwdCurrent}</td>
        </tr>
        <tr on={{ click: () => this.selectCwd('cwdHome') }}>
          <td>
            <label className='input-label'><input ref="cwdHome" className='input-radio' type='radio' />Home</label>
          </td>
          <td>{this.cwdHome}</td>
        </tr>
        {this.projects.map((project, i) => <tr on={{ click: () => this.selectCwd(`cwdProject${i}`) }}>
          <td>
            <label className='input-label'><input ref={`cwdProject${i}`} className='input-radio' type='radio' />{`Project: ${project.name}`}</label>
          </td>
          <td>{project.path}</td>
        </tr>)}
      </tbody>
    </table>
  }

  render() {
    return <div className="process-palette-modal">
      <div className="process-palette-modal-header">
        Add Terminal
      </div>
      <div className="process-palette-modal-body process-palette-custom-terminal">
        <div className="process-palette-custom-terminal-tab">
          <h2>Tab Title</h2>
          <div>
            <input ref="tabTitleEditor" className='process-palette-input input-text native-key-bindings' type='text' />
          </div>
        </div>
        <h2>Working Directory</h2>
        {this.renderWorkingDirectory()}
        <h2>Environment Variables</h2>
        <TableEditView ref="envVarsView" columns={['Name', 'Value']} />
      </div>
      <div className="process-palette-modal-footer">
        <div />
        <button className="btn" on={{ click: () => this.cancel() }}>Cancel</button>
        <button className="btn btn-primary" on={{ click: () => this.confirm() }}>OK</button>
        <div />
      </div>
    </div>
  }

  getSelectedCwd() {
    const [name] = Object.entries(this.refs).find(([name, element]) => name.startsWith('cwd') && element.checked)

    if (name === 'cwdCustom') {
      return this.refs.cwdCustomEditor.value.trim()
    } else if (name === 'cwdCurrent') {
      return this.cwdCurrent
    } else if (name === 'cwdHome') {
      return this.cwdHome
    } else {
      const index = Number.parseInt(name.substring(10))
      return this.projects[index].path
    }
  }

  getSelectedEnv() {
    const env = {}

    this.refs.envVarsView.getRows().forEach(row => {
      const name = row[0].trim()
      if (name) {
        env[name] = row[1]
      }
    })

    return env
  }

  open() {
    this.panel = atom.workspace.addModalPanel({ item: this, visible: true, autoFocus: true })
  }

  close() {
    this.disposables.dispose()

    if (this.panel) {
      this.panel.destroy()
    }
  }

  cancel() {
    this.close()
  }

  confirm() {
    const title = this.refs.tabTitleEditor.value.trim()
    const cwd = this.getSelectedCwd()
    const env = this.getSelectedEnv()

    if (!cwd) {
      atom.notifications.addError('A working directory needs to be specified.')
    } else if (!fsp.existsSync(cwd)) {
      atom.notifications.addError('The specified working directory does not exist.')
    } else if (!fsp.isDirectorySync(cwd)) {
      atom.notifications.addError('The specified working directory is not a directory.')
    } else {
      this.mainView.addTerminal(title, cwd, env)
      this.close()
    }
  }

}
