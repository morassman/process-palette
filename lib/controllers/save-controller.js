/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SaveController;
const minimatch = require('minimatch');

module.exports =
(SaveController = class SaveController {

  constructor(main, config) {
    this.fileSaved = this.fileSaved.bind(this);
    this.main = main;
    this.config = config;
    this.configController = null;
  }

  dispose() {}

  fileSaved(path) {
    if (!minimatch(path, this.config.pattern)) {
      return;
    }

    if ((this.configController == null)) {
      this.configController = this.main.getConfigController(this.config.namespace, this.config.action);
    }

    if (this.configController) {
      return this.configController.runProcessWithFile(path);
    }
  }
});
