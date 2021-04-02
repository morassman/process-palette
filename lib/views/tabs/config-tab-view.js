/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('../view')
const TabView = require('./tab-view')
const { CompositeDisposable } = require('atom')
const _ = require('underscore-plus')

class ConfigTabContentView extends View {

  constructor() {
    super(true)
    this.processController = null
  }

  showProcessOutput(processController) {
    if (this.processController && this.element.contains(this.processController.outputView.element)) {
      this.element.removeChild(this.processController.outputView.element)
    }

    this.processController = processController

    if (this.processController) {
      this.element.appendChild(this.processController.outputView.element)
    }
  }

  contentShown() {
    this.processController.outputView.contentShown()
  }

  render() {
    return <div className="process-palette-config-tab-view" attributes={this.getAttributes()} />
  }

}

export default class ConfigTabView extends TabView {

  constructor(configController) {
    super(false, null, '', new ConfigTabContentView(), false)
    this.configController = configController
    this.currentProcessController = null
    this.disposables = new CompositeDisposable()

    this.initialize()

    // Show the first process by default.
    if (configController.processControllers.length > 0) {
      this.showProcessOutput(configController.processControllers[0])
    }

    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showNamespaceInTabs', () => this.refreshLabel()))
    this.refreshLabel()
  }

  refreshLabel() {
    const showNamespace = atom.config.get('process-palette.palettePanel.showNamespaceInTabs')
    this.setLabel(this.configController.config.getHumanizedCommandName(showNamespace))
  }

  showProcessOutput(processController) {
    this.currentProcessController = processController
    this.content.showProcessOutput(processController)
  }

  isProcessOutputShown(processController) {
    return this.currentProcessController === processController
  }

  contentShown() {
    this.content.contentShown()
  }

  destroy() {
    this.disposables.dispose()
    super.destroy()
  }

}