/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const _ = require('underscore-plus');
const { CompositeDisposable, TextEditor } = require('atom');
const View = require('./view')
const PIDButtonsView = require('./pid-buttons-view');
const showInsertVariableModal = require('./modals/insert-variable-modal');

export default class ProcessView extends View {

  constructor(configController) {
    super(false);
    this.configController = configController;
    this.tooltipDisposables = null
    this.disposables = new CompositeDisposable();
    this.configController.addListener(this);

    this.initialize()

    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showNamespaceInList', () => this.refreshCommandName()))
  }

  render() {
    const headerArgs = {};
    const outputRowArgs = {};
    const showNamespace = atom.config.get('process-palette.palettePanel.showNamespaceInList')

    if (this.configController.canShowProcessOutput()) {
      headerArgs.className = 'process-palette-process-view-command-name inline-block text-highlight process-palette-pointer';
      headerArgs.on = { click: () => this.showProcessOutput() }

      outputRowArgs.className = 'process-palette-process-view-target process-palette-pointer'
      outputRowArgs.on = { click: () => this.showProcessOutput() }
    } else {
      headerArgs.className = 'process-palette-process-view-command-name inline-block text-highlight'
      outputRowArgs.className = 'process-palette-process-view-target';
    }

    let output = this.configController.config.outputTarget

    if (this.configController.config.stream) {
      output += ' (stream)'
    }

    return <div className="process-palette-process-view process-palette-process-view-list" attributes={this.getAttributes()}>
      <div className="process-palette-process-view-toolbar">
        <button className="btn btn-sm btn-fw icon-playback-play inline-block-tight" ref="runButton" on={{ click: () => this.runButtonPressed(), mousedown: e => e.preventDefault() }} />
        <span ref="commandName" {...headerArgs}>
          {this.configController.config.getHumanizedCommandName(showNamespace)}
        </span>
        {this.configController.config.keystroke && <span className="process-palette-process-view-keystroke inline-block">{_.humanizeKeystroke(this.configController.config.keystroke)}</span>}
        <PIDButtonsView ref="buttonsView" configController={this.configController} />
        <button className="btn btn-sm btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: () => this.editButtonPressed(), mousedown: e => e.preventDefault() }} />
      </div>
      <div ref="commandRow" className="process-palette-process-view-command">
        <div attributes={{ style: "flex: 1" }}>
          <TextEditor ref="commandEditor" showLineNumbers={false} softTabs={true} softWrapped={true} lineNumberGutterVisible={false} autoHeight={true} />
        </div>
        <button className="btn btn-xs icon icon-code inline-block-tight process-palette-process-view-insert-button" on={{ click: () => this.insertVariable(), mousedown: e => e.preventDefault() }}>Insert Variable</button>
      </div>
      <div ref="outputRow" {...outputRowArgs}>
        <span className="process-palette-process-view-table-title">{`Output :`}</span>
        <span>{output}</span>
      </div>
    </div>
  }

  initialize() {
    super.initialize()

    this.refs.commandEditor.setText(this.configController.config.getFullCommand())
    this.refs.commandEditor.element.classList.add('process-palette-process-view-command-editor')
    this.refs.commandEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.commandEditor.setHorizontalScrollMargin(0)
    this.refs.commandEditor.onDidStopChanging(() => this.commandChanged());
    this.applySettings();
    this.addTooltips()
  }

  refreshCommandName() {
    const showNamespace = atom.config.get('process-palette.palettePanel.showNamespaceInList')
    this.refs.commandName.textContent = this.configController.config.getHumanizedCommandName(showNamespace)
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
    this.tooltipDisposables.add(atom.tooltips.add(this.refs.editButton, { title: 'Edit' }))
  }

  removeTooltips() {
    if (this.tooltipDisposables) {
      this.tooltipDisposables.dispose()
      this.tooltipDisposables = null
    }
  }

  show() {
    super.show()
    this.addTooltips()
  }

  hide() {
    super.hide()
    this.removeTooltips()
  }

  remove() {
    super.remove()
    this.removeTooltips()
  }

  applySettings() {
    this.setCommandVisible(atom.config.get('process-palette.palettePanel.showCommand'));
    this.setOutputTargetVisible(atom.config.get('process-palette.palettePanel.showOutputTarget'));
  }

  setCommandVisible(visible) {
    this.refs.commandRow.style.display = visible ? 'flex' : 'none'
  }

  setOutputTargetVisible(visible) {
    this.refs.outputRow.style.display = visible ? 'inline-block' : 'none'
  }

  insertVariable() {
    showInsertVariableModal(this.refs.commandEditor)
  }

  commandChanged() {
    if (this.commandChangedCalled) {
      this.configController.setCommand(this.refs.commandEditor.getText());
    } else {
      this.commandChangedCalled = true;
    }
  }

  showProcessOutput() {
    const processController = this.configController.getFirstProcessController();

    if (processController) {
      processController.showProcessOutput();
    }
  }

  processStarted() { }

  processStopped() { }

  processControllerRemoved(processController) { }

  runButtonPressed() {
    this.configController.runProcess();
    this.refreshTooltips()
  }

  editButtonPressed() {
    this.configController.guiEdit();
    this.refreshTooltips()
  }

  destroy() {
    this.removeTooltips()
    this.disposables.dispose()
    this.configController.removeListener(this);
    this.refs.buttonsView.destroy();
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
