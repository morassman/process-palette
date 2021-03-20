/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const _ = require('underscore-plus');
const {CompositeDisposable} = require('atom');
const { TextEditorView } = require('atom-space-pen-views');
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
                  <TextEditorView ref="commandEditor" />
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

  static content(configController) {
    const headerArgs = {};
    const outputTitleArgs = {};
    const outputValueArgs = {};

    if (configController.config.outputToPanel()) {
      headerArgs.class = 'header inline-block text-highlight hand-cursor';
      headerArgs.click = 'showProcessOutput';

      outputTitleArgs.class = 'table-title hand-cursor';
      outputTitleArgs.click = 'showProcessOutput';

      outputValueArgs.class = 'table-value hand-cursor';
      outputValueArgs.click = 'showProcessOutput';
    } else {
      headerArgs.class = 'header inline-block text-highlight';
      outputTitleArgs.class = 'table-title';
      outputValueArgs.class ='table-value';
    }

    let {
      outputTarget
    } = configController.config;
    let {
      successOutput
    } = configController.config;

    if (outputTarget === 'panel') {
      outputTarget = '';
    } else {
      outputTarget = ` (${outputTarget})`;
    }

    if (configController.config.stream) {
      successOutput = 'stream';
    }

    return this.div({class:'process-list-item'}, () => {
      this.div({class: 'process-toolbar'}, () => {
        this.button({class:'btn btn-sm btn-fw icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'});
        this.button({class:'btn btn-sm btn-fw icon-pencil inline-block-tight', outlet:'editButton', click:'editButtonPressed'});
        this.span(_.humanizeEventName(configController.config.getCommandName()), headerArgs);
        if (configController.config.keystroke) {
          this.span(_.humanizeKeystroke(configController.config.keystroke), {class:'keystroke inline-block highlight'});
        }
        return this.subview('buttonsView', new ButtonsView(configController));
      });
      return this.table(() => {
        return this.tbody(() => {
          this.tr({outlet: 'commandRow'}, () => {
            this.td('Command', {class: 'table-title'});
            return this.td(() => {
              return this.div({style: "display: flex; align-items: center"}, () => {
                this.div({style: "flex: 1"}, () => {
                  return this.subview('commandEditor', new TextEditorView());
                });
                return this.button('Insert Variable', {class: 'btn btn-xs insert-button', click: 'insertVariable'});
            });
          });
        });
          return this.tr({outlet: 'outputRow'}, () => {
            this.td(`Output${outputTarget}`, outputTitleArgs);
            this.td(`${successOutput}`, outputValueArgs);
            return this.td({class: 'table-none'});
        });
      });
    });
  });
  }

  initialize() {
    super.initialize()
    this.disposables = new CompositeDisposable();
    // TODO
    this.disposables.add(atom.tooltips.add(this.refs.runButton, { title: 'Run process' }));
    this.disposables.add(atom.tooltips.add(this.refs.editButton, { title: 'Edit' }));
    this.refs.commandEditor.getModel().setText(this.configController.config.getFullCommand());
    this.refs.commandEditor.addClass('command-editor');
    this.refs.commandEditor.addClass('multi-line-editor');
    this.refs.commandEditor.getModel().setSoftTabs(true);
    this.refs.commandEditor.getModel().setSoftWrapped(true);
    this.refs.commandEditor.getModel().setLineNumberGutterVisible(false);
    this.refs.commandEditor.getModel().onDidStopChanging(() => this.commandChanged());
    this.applySettings();

    // Prevent the button from getting focus.
    // this.runButton.on('mousedown', e => e.preventDefault());
  }

  applySettings() {
    this.setCommandVisible(atom.config.get('process-palette.palettePanel.showCommand'));
    this.setOutputTargetVisible(atom.config.get('process-palette.palettePanel.showOutputTarget'));
  }

  setCommandVisible(visible) {
    this.refs.commandRow.setAttribute('display', visible ? 'table-row' : 'none')
  }

  setOutputTargetVisible(visible) {
    this.refs.outputRow.setAttribute('display', visible ? 'table-row' : 'none')
  }

  insertVariable() {
    new InsertVariableView(this.refs.commandEditor);
  }

  commandChanged() {
    if (this.initialized) {
      return this.configController.setCommand(this.refs.commandEditor.getModel().getText());
    } else {
      return this.initialized = true;
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
    this.buttonsView.destroy();
    return this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
