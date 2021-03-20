/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProjectView;
const {$, $$, View} = require('atom-space-pen-views');
const {CompositeDisposable} = require('atom');

let ProcessView = null;

module.exports =
(ProjectView = class ProjectView extends View {

  constructor(controller) {
    super(controller);
    this.controller = controller;
    this.addConfigController = this.addConfigController.bind(this);
    this.removeConfigController = this.removeConfigController.bind(this);
    this.getProcessView = this.getProcessView.bind(this);
    this.showProcessOutput = this.showProcessOutput.bind(this);

    this.processViews = [];
    this.folded = false;
    this.disposables = new CompositeDisposable();

    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showCommand', ({newValue, oldValue}) => this.setCommandVisible(newValue)));
    this.disposables.add(atom.config.onDidChange('process-palette.palettePanel.showOutputTarget', ({newValue, oldValue}) => this.setOutputTargetVisible(newValue)));
  }

  static content(controller) {
    return this.div({class: "project-view"}, () => {
      this.div({class: "project-heading hand-cursor", click: "toggleFolded"}, () => {
        this.div({class: "name", outlet: "projectName"});
        return this.span({class: "icon icon-fold", outlet: "foldButton"});
    });
      return this.div({class: "process-list", outlet: "processList"});
  });
  }

  initialize() {
    this.projectName.html(this.controller.getDisplayName());
    return this.foldButton.on('mousedown', e => e.preventDefault());
  }

  toggleFolded() {
    if (this.folded) {
      this.foldButton.addClass('icon-fold');
      this.foldButton.removeClass('icon-unfold');
    } else {
      this.foldButton.addClass('icon-unfold');
      this.foldButton.removeClass('icon-fold');
    }

    this.folded = !this.folded;

    if (this.folded) {
      return this.processList.hide();
    } else {
      return this.processList.show();
    }
  }

  setCommandVisible(visible) {
    return Array.from(this.processViews).map((processView) =>
      processView.setCommandVisible(visible));
  }

  setOutputTargetVisible(visible) {
    return Array.from(this.processViews).map((processView) =>
      processView.setOutputTargetVisible(visible));
  }

  addConfigController(configController) {
    if (ProcessView == null) { ProcessView = require('./process-view'); }
    const processView = new ProcessView(configController);
    this.processViews.push(processView);

    return this.processList.append($$(function() {
      return this.div(() => {
        return this.subview(configController.config.id, processView);
      });
    })
    );
  }

  removeConfigController(configController) {
    const processView = this.getProcessView(configController);

    if (processView) {
      const index = this.processViews.indexOf(processView);
      this.processViews.splice(index, 1);
      return processView.destroy();
    }
  }

  getProcessView(configController) {
    for (let processView of Array.from(this.processViews)) {
      if (processView.configController === configController) {
        return processView;
      }
    }

    return null;
  }

  showProcessOutput(processController) {
    return processController.showProcessOutput();
  }

  serialize() {}

  destroy() {
    this.disposables.dispose();
    return this.processList.remove();
  }

  getElement() {
    return this.element;
  }

  parentHeightChanged(parentHeight) {}
});
    // @processList.height(parentHeight);
