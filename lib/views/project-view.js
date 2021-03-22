/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const ProcessView = require('./process-view');
const {CompositeDisposable} = require('atom');

class ProcessList extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div className="process-list" attributes={this.getAttributes()} />
  }

}

export default class ProjectView extends View {

  constructor(controller) {
    super(false);
    this.controller = controller;
    this.processViews = [];
    this.folded = false;
    this.disposables = new CompositeDisposable();

    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showCommand', ({newValue, oldValue}) => this.setCommandVisible(newValue)));
    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showOutputTarget', ({newValue, oldValue}) => this.setOutputTargetVisible(newValue)));
    this.initialize()
  }

  render() {
    return <div className="process-palette-project-view" attributes={this.getAttributes()}>
      <div className="project-heading hand-cursor" on={{ click: this.toggleFolded }}>
        <div className="icon icon-fold" ref="foldButton" attributes={{ style: 'padding-top: 6px; width: 1.5em' }} on={{ mousedown: (e) => e.preventDefault() }} />
        <div className="name" ref="projectName">{this.controller.getDisplayName()}</div>

      </div>
      <ProcessList ref="processList" />
    </div>
  }

  toggleFolded() {
    if (this.folded) {
      this.refs.foldButton.classList.add('icon-fold');
      this.refs.foldButton.classList.remove('icon-unfold');
    } else {
      this.refs.foldButton.classList.add('icon-unfold');
      this.refs.foldButton.classList.remove('icon-fold');
    }

    this.folded = !this.folded;

    if (this.folded) {
      this.refs.processList.hide();
    } else {
      this.refs.processList.show();
    }
  }

  setCommandVisible(visible) {
    this.processViews.forEach((processView) => processView.setCommandVisible(visible));
  }

  setOutputTargetVisible(visible) {
    this.processViews.forEach((processView) => processView.setOutputTargetVisible(visible));
  }

  addConfigController(configController) {
    const processView = new ProcessView(configController);
    this.processViews.push(processView);
    this.refs.processList.append(processView.element)
  }

  removeConfigController(configController) {
    const processView = this.getProcessView(configController);

    if (processView) {
      const index = this.processViews.indexOf(processView);
      this.processViews.splice(index, 1);
      processView.destroy();
    }
  }

  getProcessView(configController) {
    for (let processView of this.processViews) {
      if (processView.configController === configController) {
        return processView;
      }
    }

    return null;
  }

  showProcessOutput(processController) {
    processController.showProcessOutput();
  }

  serialize() {}

  destroy() {
    this.disposables.dispose();
    this.refs.processList.destroy()
  }

  getElement() {
    return this.element;
  }

  parentHeightChanged(parentHeight) {}

}
