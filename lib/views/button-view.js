/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ButtonView;
const {CompositeDisposable} = require('atom');
const {View} = require('atom-space-pen-views');

module.exports =
(ButtonView = class ButtonView extends View {

  constructor(configController, processController) {
    super(configController, processController);
    this.configController = configController;
    this.processController = processController;
    this.processStarted = this.processStarted.bind(this);
    this.processStopped = this.processStopped.bind(this);

    this.processController.addProcessCallback(this);

    if (this.processController.process === null) {
      this.showTrashIcon();
    }
  }

  static content(configController, processController) {
    return this.span({class: "btn-group", style: "display: flex; margin-right: 0.5em"}, () => {
      this.button({class: "btn btn-sm btn-fw icon-primitive-square", outlet: "killButton", click: "killButtonPressed"});
      return this.button(`${processController.getProcessID()}`, {class: "btn btn-sm ", outlet: "showOutputButton", click: "showOutputButtonPressed"});
  });
  }

  initialize() {
    this.disposables = new CompositeDisposable();

    // Prevent the button from getting focus.
    this.killButton.on('mousedown', e => e.preventDefault());

    this.showOutputButton.on('mousedown', e => e.preventDefault());

    this.disposables.add(atom.tooltips.add(this.killButton, {title: "Kill/Discard"}));
    return this.disposables.add(atom.tooltips.add(this.showOutputButton, {title: "Show output"}));
  }

  destroy() {
    this.disposables.dispose();
    this.processController.removeProcessCallback(this);
    return this.element.remove();
  }

  getElement() {
    return this.element;
  }

  processStarted() {}

  processStopped() {
    return this.showTrashIcon();
  }

  showTrashIcon() {
    this.killButton.removeClass('icon-primitive-square');
    return this.killButton.addClass('icon-x');
  }

  killButtonPressed() {
    if (this.processController.process !== null) {
      return this.processController.killProcess(false);
    } else {
      return this.processController.discard();
    }
  }

  showOutputButtonPressed() {
    if (this.isHighlighted()) {
      return;
    }

    const {
      outputTarget
    } = this.configController.config;

    if (outputTarget === "panel") {
      return this.processController.showProcessOutput();
    } else if (outputTarget === "console") {
      return atom.openDevTools();
    } else if (outputTarget === "file") {
      return this.processController.showNewFile();
    }
  }

  highlight() {
    return this.showOutputButton.addClass("btn-primary selected");
  }

  isHighlighted() {
    return this.showOutputButton.hasClass("selected");
  }
});
