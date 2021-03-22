/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const ButtonView = require('./button-view');

class ButtonListView extends View {

  constructor() {
    super(false)
    this.style.merge({
      display: "flex",
      "flex-direction": "row"
    })
    this.initialize()
  }

  render() {
    return <span attributes={this.getAttributes()} />
  }
}

export default class ButtonsView extends View {

  constructor({ configController, parentProcessController }) {
    super(true);
    this.configController = configController;
    this.parentProcessController = parentProcessController;
    this.buttonViews = [];

    for (let processController of this.configController.processControllers) {
      this.addButton(processController);
    }

    this.configController.addListener(this);
  }

  render() {
    return <ButtonListView ref="buttonListView" />
  }

  getElement() {
    return this.element;
  }

  destroy() {
    for (let buttonView of this.buttonViews) {
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
    return this.refs.buttonListView.append(buttonView);
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

    // TODO
    buttonView.destroy()
    // const buttonViewParent = buttonView.parent();
    // return $(buttonViewParent).fadeOut(200, () => {
    //   buttonView.destroy();
    //   return buttonViewParent.remove();
    // });
  }

  getButtonView(processController) {
    for (let buttonView of this.buttonViews) {
      if (buttonView.processController === processController) {
        return buttonView;
      }
    }

    return null;
  }

}
