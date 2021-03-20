/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProcessView;
const _ = require('underscore-plus');
const {CompositeDisposable} = require('atom');
const {View, TextEditorView} = require('atom-space-pen-views');
const ButtonsView = require('./buttons-view');
const InsertVariableView = require('./edit/insert-variable-view');

module.exports =
(ProcessView = class ProcessView extends View {

  constructor(configController) {
    super(configController);
    this.configController = configController;
    this.showProcessOutput = this.showProcessOutput.bind(this);
    this.processStarted = this.processStarted.bind(this);
    this.processStopped = this.processStopped.bind(this);
    this.configController.addListener(this);
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
    this.disposables = new CompositeDisposable();
    this.disposables.add(atom.tooltips.add(this.runButton, {title: 'Run process'}));
    this.disposables.add(atom.tooltips.add(this.editButton, {title: 'Edit'}));
    this.commandEditor.getModel().setText(this.configController.config.getFullCommand());
    this.commandEditor.addClass('command-editor');
    this.commandEditor.addClass('multi-line-editor');
    this.commandEditor.getModel().setSoftTabs(true);
    this.commandEditor.getModel().setSoftWrapped(true);
    this.commandEditor.getModel().setLineNumberGutterVisible(false);
    this.commandEditor.getModel().onDidStopChanging(() => this.commandChanged());
    this.applySettings();

    // Prevent the button from getting focus.
    return this.runButton.on('mousedown', e => e.preventDefault());
  }

  applySettings() {
    this.setCommandVisible(atom.config.get('process-palette.palettePanel.showCommand'));
    return this.setOutputTargetVisible(atom.config.get('process-palette.palettePanel.showOutputTarget'));
  }

  setCommandVisible(visible) {
    if (visible) {
      return this.commandRow.show();
    } else {
      return this.commandRow.hide();
    }
  }

  setOutputTargetVisible(visible) {
    if (visible) {
      return this.outputRow.show();
    } else {
      return this.outputRow.hide();
    }
  }

  insertVariable() {
    return new InsertVariableView(this.commandEditor);
  }

  commandChanged() {
    if (this.initialized) {
      return this.configController.setCommand(this.commandEditor.getModel().getText());
    } else {
      return this.initialized = true;
    }
  }

  showProcessOutput() {
    const processController = this.configController.getFirstProcessController();

    if (processController !== null) {
      return processController.showProcessOutput();
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
});
