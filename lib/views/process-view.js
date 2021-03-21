/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const _ = require('underscore-plus');
const { CompositeDisposable, TextEditor } = require('atom');
const View = require('./view')
const ButtonsView = require('./buttons-view');
const InsertVariableView = require('./edit/insert-variable-view');

export default class ProcessView extends View {

  constructor(configController) {
    super(false);
    this.configController = configController;
    this.showProcessOutput = this.showProcessOutput.bind(this);
    this.processStarted = this.processStarted.bind(this);
    this.processStopped = this.processStopped.bind(this);
    this.configController.addListener(this);
    this.initialize()
  }

  render() {
    const headerArgs = {};
    const outputTitleArgs = {};
    const outputValueArgs = {};

    if (this.configController.config.outputToPanel()) {
      headerArgs.className = 'header inline-block text-highlight hand-cursor';
      headerArgs.on = { click: this.showProcessOutput }

      outputTitleArgs.className = 'table-title hand-cursor';
      outputTitleArgs.on = { click: this.showProcessOutput }

      outputValueArgs.className = 'table-value hand-cursor';
      outputValueArgs.on = { click: this.showProcessOutput }
    } else {
      headerArgs.className = 'header inline-block text-highlight';
      outputTitleArgs.className = 'table-title';
      outputValueArgs.className = 'table-value';
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

    return <div className="process-list-item" attributes={this.getAttributes()}>
      <div className="process-toolbar">
        <button className="btn btn-sm btn-fw icon-playback-play inline-block-tight" ref="runButton" on={{ click: this.runButtonPressed, mousedown: e => e.preventDefault() }} />
        <button className="btn btn-sm btn-fw icon-pencil inline-block-tight" ref="editButton" on={{ click: this.editButtonPressed }} />
        <span {...headerArgs}>{_.humanizeEventName(this.configController.config.getCommandName())}</span>
        {this.configController.config.keystroke && <span className="keystroke inline-block highlight">{_.humanizeKeystroke(this.configController.config.keystroke)}</span>}
        <ButtonsView ref="buttonsView" configController={this.configController} />
      </div>
      <table>
        <tbody>
          <tr ref="commandRow">
            <td className="table-title">Command</td>
            <td>
              <div attributes={{ style: "display: flex; align-items: center" }}>
                <div attributes={{ style: "flex: 1" }}>
                  <TextEditor ref="commandEditor" showLineNumbers={false} softTabs={true} softWrapped={true} lineNumberGutterVisible={false} autoHeight={true} />
                </div>
                <button className="btn btn-xs insert-button" on={{ click: this.insertVariable }}>Insert Variable</button>
              </div>
            </td>
          </tr>
          <tr ref="outputRow">
            <td {...outputTitleArgs}>{`Output${outputTarget}`}</td>
            <td {...outputValueArgs}>{successOutput}</td>
            <td className="table-none"></td>
          </tr>
        </tbody>
      </table>
    </div>
  }

  initialize() {
    super.initialize()
    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.tooltips.add(this.refs.runButton, { title: 'Run process' }));
    this.disposables.add(atom.tooltips.add(this.refs.editButton, { title: 'Edit' }));
    this.refs.commandEditor.setText(this.configController.config.getFullCommand())
    this.refs.commandEditor.element.classList.add('command-editor')
    this.refs.commandEditor.element.classList.add('multi-line-editor')
    this.refs.commandEditor.setHorizontalScrollMargin(0)
    this.refs.commandEditor.onDidStopChanging(() => this.commandChanged());
    this.applySettings();
  }

  applySettings() {
    this.setCommandVisible(atom.config.get('process-palette.palettePanel.showCommand'));
    this.setOutputTargetVisible(atom.config.get('process-palette.palettePanel.showOutputTarget'));
  }

  setCommandVisible(visible) {
    this.refs.commandRow.style.display = visible ? 'table-row' : 'none'
  }

  setOutputTargetVisible(visible) {
    this.refs.outputRow.style.display = visible ? 'table-row' : 'none'
  }

  insertVariable() {
    new InsertVariableView(this.refs.commandEditor);
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

    if (processController !== null) {
      processController.showProcessOutput();
    }
  }

  processStarted() {}
    // @runKillButton.removeClass('icon-playback-play');
    // @runKillButton.addClass('icon-x');

    // if @configController.config.outputToPanel()
      // @showProcessOutput();

  processStopped() {}
    // @runKillButton.removeClass('icon-x');
    // @runKillButton.addClass('icon-playback-play');

  processControllerRemoved(processController) {}
    // @main.processControllerRemoved(processController);

  runButtonPressed() {
    return this.configController.runProcess();
  }

  editButtonPressed() {
    return this.configController.guiEdit();
  }

  destroy() {
    this.disposables.dispose();
    this.configController.removeListener(this);
    this.refs.buttonsView.destroy();
    return this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
