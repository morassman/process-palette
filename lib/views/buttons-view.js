/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ButtonsView;
const ButtonView = require('./button-view');
const {$, $$, View} = require('atom-space-pen-views');

module.exports =
(ButtonsView = class ButtonsView extends View {

  constructor(configController, parentProcessController) {
    super();
    this.configController = configController;
    this.parentProcessController = parentProcessController;
    this.buttonViews = [];

    for (let processController of Array.from(this.configController.processControllers)) {
      this.addButton(processController);
    }
  }

  initialize() {
    return this.configController.addListener(this);
  }

  static content() {
    return this.span(() => {
      return this.span({style: "display: flex; flex-direction: row", outlet: "buttonListView"});
  });
  }

  getElement() {
    return this.element;
  }

  destroy() {
    for (let buttonView of Array.from(this.buttonViews)) {
      buttonView.destroy();
    }

    this.configController.removeListener(this);
    return this.element.remove();
  }

  processStarted(processController) {
    this.addButton(processController);

    if ((processController.config.outputTarget === "panel") && processController.config.autoShowOutput) {
      return processController.showProcessOutput();
    }
  }

  addButton(processController) {
    const buttonView = new ButtonView(this.configController, processController);

    if (processController === this.parentProcessController) {
      buttonView.highlight();
    }

    this.buttonViews.push(buttonView);

    return this.buttonListView.append($$(function() {
      return this.span(() => {
        return this.subview(`pid${processController.getProcessID()}`, buttonView);
      });
    })
    );
  }

  processStopped(processController) {}

  processControllerRemoved(processController) {
    const buttonView = this.getButtonView(processController);

    if (buttonView === null) {
      return;
    }

    const index = this.buttonViews.indexOf(buttonView);

    if (index !== -1) {
      this.buttonViews.splice(index, 1);
    }

    const buttonViewParent = buttonView.parent();
    return $(buttonViewParent).fadeOut(200, () => {
      buttonView.destroy();
      return buttonViewParent.remove();
    });
  }

  getButtonView(processController) {
    for (let buttonView of Array.from(this.buttonViews)) {
      if (buttonView.processController === processController) {
        return buttonView;
      }
    }

    return null;
  }
});
