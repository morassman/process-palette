/** @babel */
const minimatch = require('minimatch');

export default class SaveController {

  constructor(main, config) {
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
      this.configController.runProcessWithFile(path);
    }
  }

}
