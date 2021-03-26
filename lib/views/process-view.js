/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const _ = require('underscore-plus');
const { CompositeDisposable, TextEditor } = require('atom');
const View = require('./view')
const ButtonsView = require('./buttons-view');
const showInsertVariableView = require('./edit/insert-variable-view');

export default class ProcessView extends View {

  constructor(configController) {
    super(false);
    this.configController = configController;
    this.tooltipDisposables = null
    this.configController.addListener(this);
    this.initialize()
  }

  render() {
    const headerArgs = {};
    const outputTitleArgs = {};
    const outputValueArgs = {};

    if (this.configController.config.outputToPanel()) {
      headerArgs.className = 'process-palette-process-view-command-name inline-block text-highlight process-palette-pointer';
      headerArgs.on = { click: () => this.showProcessOutput() }

      outputTitleArgs.className = 'process-palette-process-view-table-title process-palette-pointer';
      outputTitleArgs.on = { click: () => this.showProcessOutput() }

      outputValueArgs.className = 'process-palette-pointer';
      outputValueArgs.on = { click: () => this.showProcessOutput() }
    } else {
      headerArgs.className = 'process-palette-process-view-command-name inline-block text-highlight'
      outputTitleArgs.className = 'process-palette-process-view-table-title';
    }

    let { outputTarget } = this.configController.config;
    let { successOutput } = this.configController.config;

    if (outputTarget === 'panel') {
      outputTarget = '';
    } else {
      outputTarget = ` (${outputTarget})`;
    }

    if (this.configController.config.stream) {
      successOutput = 'stream';
    }

    return <div className="process-palette-process-view process-palette-process-view-list" attributes={this.getAttributes()}>
      <div className="process-palette-process-view-toolbar">
        <button className="btn btn-sm btn-fw icon-playback-play inline-block-tight" ref="runButton" on={{ click: () => this.runButtonPressed(), mousedown: e => e.preventDefault() }} />
        <span {...headerArgs}>{_.humanizeEventName(this.configController.config.getCommandName())}</span>
        {this.configController.config.keystroke && <span className="process-palette-process-view-keystroke inline-block">{_.humanizeKeystroke(this.configController.config.keystroke)}</span>}
        <ButtonsView ref="buttonsView" configController={this.configController} />
        <button className="btn btn-sm btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: () => this.editButtonPressed(), mousedown: e => e.preventDefault() }} />
      </div>
      <div ref="commandRow" className="process-palette-process-view-command">
        <div attributes={{ style: "flex: 1" }}>
          <TextEditor ref="commandEditor" showLineNumbers={false} softTabs={true} softWrapped={true} lineNumberGutterVisible={false} autoHeight={true} />
        </div>
        <button className="btn btn-xs process-palette-process-view-insert-button" on={{ click: () => this.insertVariable(), mousedown: e => e.preventDefault() }}>Insert Variable</button>
      </div>
      <div ref="outputRow" className="process-palette-process-view-target">
        <span {...outputTitleArgs}>{`Output${outputTarget}`}</span>
        <span {...outputValueArgs}>{successOutput}</span>
      </div>
    </div>
  }

  initialize() {
    super.initialize()
    this.disposables = new CompositeDisposable();

    this.refs.commandEditor.setText(this.configController.config.getFullCommand())
    this.refs.commandEditor.element.classList.add('process-palette-process-view-command-editor')
    this.refs.commandEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.commandEditor.setHorizontalScrollMargin(0)
    this.refs.commandEditor.onDidStopChanging(() => this.commandChanged());
    this.applySettings();
    this.addTooltips()
  }

  addTooltips() {
    if (this.tooltipDisposables) {
      return
    }

    // this.tooltipDisposables = new CompositeDisposable()
    // this.tooltipDisposables.add(atom.tooltips.add(this.refs.runButton, { title: 'Run process' }))
    // this.tooltipDisposables.add(atom.tooltips.add(this.refs.editButton, { title: 'Edit' }))
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
    this.refs.outputRow.style.display = visible ? 'flex' : 'none'
  }

  insertVariable() {
    showInsertVariableView(this.refs.commandEditor)
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
  }

  editButtonPressed() {
    this.configController.guiEdit();
  }

  destroy() {
    this.removeTooltips()
    this.configController.removeListener(this);
    this.refs.buttonsView.destroy();
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
