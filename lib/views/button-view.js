/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { CompositeDisposable } = require('atom');
const View = require('./view')

export default class ButtonView extends View {

  constructor(configController, processController) {
    super(false)
    this.configController = configController;
    this.processController = processController;
    this.disposables = new CompositeDisposable();

    this.processController.addProcessCallback(this);

    this.initialize()
  }

  render() {
    return <span className="btn-group" attributes={{ style: "margin-right: 0.5em" }}>
      <button ref="killButton" className="btn btn-sm btn-fw icon-primitive-square" on={{ click: this.killButtonPressed, mousedown: e => e.preventDefault() }} />
      <button ref="showOutputButton" className="btn btn-sm" on={{ click: this.showOutputButtonPressed, mousedown: e => e.preventDefault() }}>
        {this.processController.getProcessID()}
      </button>
    </span>
  }

  initialize() {
    super.initialize()

    this.disposables.add(atom.tooltips.add(this.refs.killButton, { title: "Kill/Discard" }));
    this.disposables.add(atom.tooltips.add(this.refs.showOutputButton, { title: "Show output" }));

    if (this.processController.process === null) {
      this.showTrashIcon()
    }
  }

  destroy() {
    this.disposables.dispose();
    this.processController.removeProcessCallback(this);
    super.destroy()
  }

  getElement() {
    return this.element;
  }

  processStarted() {}

  processStopped() {
    this.showTrashIcon();
  }

  showTrashIcon() {
    this.refs.killButton.classList.remove('icon-primitive-square');
    this.refs.killButton.classList.add('icon-x');
  }

  killButtonPressed() {
    if (this.processController.process !== null) {
      this.processController.killProcess(false);
    } else {
      this.processController.discard();
    }
  }

  showOutputButtonPressed() {
    if (this.isHighlighted()) {
      return;
    }

    const { outputTarget } = this.configController.config;

    if (outputTarget === "panel") {
      this.processController.showProcessOutput();
    } else if (outputTarget === "console") {
      atom.openDevTools();
    } else if (outputTarget === "file") {
      this.processController.showNewFile();
    }
  }

  highlight() {
    this.refs.showOutputButton.classList.add("btn-primary", "selected");
  }

  isHighlighted() {
    return this.refs.showOutputButton.classList.contains("selected");
  }
}
