/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const PIDButtonView = require('./pid-button-view')

class PIDButtonListView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <span className="process-palette-pid-btn-list" attributes={this.getAttributes()} />
  }
}

export default class PIDButtonsView extends View {

  constructor({ configController, parentProcessController }) {
    super(true)
    this.configController = configController
    this.parentProcessController = parentProcessController
    this.buttonViews = []

    for (let processController of this.configController.processControllers) {
      this.addButton(processController)
    }

    this.configController.addListener(this)
  }

  render() {
    return <PIDButtonListView ref="buttonListView" />
  }

  getElement() {
    return this.element
  }

  destroy() {
    for (let buttonView of this.buttonViews) {
      buttonView.destroy()
    }

    this.configController.removeListener(this)
    return this.element.remove()
  }

  processStarted(processController) {
    this.addButton(processController)
  }

  addButton(processController) {
    const buttonView = new PIDButtonView(this.configController, processController)

    if (processController === this.parentProcessController) {
      buttonView.highlight()
    }

    this.buttonViews.push(buttonView)
    this.refs.buttonListView.append(buttonView)
  }

  processStopped(processController) { }

  processControllerRemoved(processController) {
    const buttonView = this.getButtonView(processController)

    if (buttonView === null) {
      return
    }

    const index = this.buttonViews.indexOf(buttonView)

    if (index !== -1) {
      this.buttonViews.splice(index, 1)
    }

    buttonView.destroy()
  }

  getButtonView(processController) {
    for (let buttonView of this.buttonViews) {
      if (buttonView.processController === processController) {
        return buttonView
      }
    }

    return null
  }

}
