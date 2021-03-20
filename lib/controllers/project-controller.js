/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProjectController;
const ProcessConfig = require('../process-config');
const SaveController = require('./save-controller');
const ConfigController = require('./config-controller');
const ProcessController = require('./process-controller');
const RegExpPattern = require('../pattern/regexp-pattern');
const ProjectView = require('../views/project-view');
const {Directory, File, BufferedProcess, CompositeDisposable} = require('atom');

module.exports =
(ProjectController = class ProjectController {

  constructor(main, projectPath) {
    this.fileSaved = this.fileSaved.bind(this);
    this.getConfigController = this.getConfigController.bind(this);
    this.main = main;
    this.projectPath = projectPath;
    this.configControllers = [];
    this.saveControllers = [];
    this.patterns = {};
    this.configurationFile = new Directory(this.projectPath).getFile('process-palette.json');
    this.processConfigs = {};
    this.global = null;
    this.projectName = null;
    this.view = new ProjectView(this);
    this.loadFile();
  }

  getMain() {
    return this.main;
  }

  getConfigControllers() {
    return this.configControllers;
  }

  isGlobal() {
    if (this.global === null) {
      const configFile = new File(atom.config.getUserConfigPath());
      this.global = this.projectPath === configFile.getParent().getRealPathSync();
    }

    return this.global;
  }

  getDisplayName() {
    if (this.isGlobal()) {
      return 'Global';
    }

    return this.getProjectName();
  }

  getProjectName() {
    if (this.projectName === null) {
      const dir = new Directory(this.projectPath);
      this.projectName = dir.getBaseName();
    }

    return this.projectName;
  }

  getProjectPath() {
    return this.projectPath;
  }

  getConfigurationFile() {
    return this.configurationFile;
  }

  dispose() {
    this.clearControllers();
    return this.view.remove();
  }

  clearControllers() {
    this.clearConfigControllers();
    return this.clearSaveControllers();
  }

  clearConfigControllers() {
    for (let configController of Array.from(this.configControllers)) {
      this.view.removeConfigController(configController);
      configController.dispose();
    }

    return this.configControllers = [];
  }

  clearSaveControllers() {
    for (let saveController of Array.from(this.saveControllers)) {
      saveController.dispose();
    }

    return this.saveControllers = [];
  }

  saveFile() {
    // A ProjectController is created for each project, but that doesn't mean that
    // it has a configuration file. Only save if there is actually a file, otherwise
    // an empty file will be created.
    if (this.configurationFile.existsSync()) {
      const text = JSON.stringify(this.processConfigs, null, '  ');
      return this.configurationFile.writeSync(text);
    }
  }

  loadFile() {
    this.clearControllers();

    if (!this.configurationFile.isFile() || !this.configurationFile.existsSync()) {
      return;
    }

    return this.configurationFile.read(true).then(resolve => {
      return this.parseFile(resolve);
    });
  }

  parseFile(content) {
    try {
      this.processConfigs = JSON.parse(content);
    } catch (err) {
      console.log("error");
      console.log(err.lineNumber);
      return;
    }

    if ((this.processConfigs == null)) {
      return;
    }

    this.addDefaultPattern();

    if (this.processConfigs.patterns != null) {
      for (let key in this.processConfigs.patterns) {
        const value = this.processConfigs.patterns[key];
        this.addPattern(key, value);
      }
    }

    if (this.processConfigs.commands != null) {
      const commands = this.processConfigs.commands.slice();
      this.processConfigs.commands = [];

      for (let command of Array.from(commands)) {
        command = new ProcessConfig(command);
        this.processConfigs.commands.push(command);

        if (command.isValid()) {
          const configController = new ConfigController(this, command);
          this.configControllers.push(configController);
          this.view.addConfigController(configController);
        }
      }
    }

    if (this.processConfigs.saveCommands != null) {
      for (let saveCommand of Array.from(this.processConfigs.saveCommands)) {
        const saveController = new SaveController(this.main, saveCommand);
        this.saveControllers.push(saveController);
      }
    }

    return this.main.recreateTreeViewContextMenu();
  }

  getPatterns(names) {
    const result = [];

    if ((names == null)) {
      return result;
    }

    for (let name of Array.from(names)) {
      const pattern = this.patterns[name];

      if (pattern) {
        result.push(pattern);
      }
    }

    return result;
  }

  addDefaultPattern() {
    const config = {};
    config.expression = "(path)";
    return this.addPattern("default", config);
  }

  addPattern(name, config) {
    const pattern = this.createRegExpPattern(name, config);

    if (pattern !== null) {
      return this.patterns[name] = pattern;
    }
  }

  createRegExpPattern(name, config) {
    // Make a copy so that the original doesn't get modified.
    config = JSON.parse(JSON.stringify(config));

    if ((config.expression == null)) {
      console.error(`Pattern ${name} doesn't have an expression.`);
      return null;
    }

    if ((config.flags == null)) {
      config.flags = "i";
    }

    if (config.expression.indexOf("(path)") === -1) {
      console.error(`Pattern ${name} doesn't have (path) in its expression.`);
      return null;
    }

    const pathIndex = config.expression.indexOf("(path)");
    const lineIndex = config.expression.indexOf("(line)");

    config.pathIndex = 1;

    if (lineIndex > -1) {
      if (pathIndex < lineIndex) {
        config.lineIndex = 2;
      } else {
        config.lineIndex = 1;
        config.pathIndex = 2;
      }
    }

    if ((config.path == null)) {
      config.path = this.getPathExpression(lineIndex > -1);
    }

    config.expression = config.expression.replace("(path)", "("+config.path+")");
    config.expression = config.expression.replace("(line)", "(\\d+)");

    try {
      return new RegExpPattern(config);
    } catch (err) {
      console.error(`Pattern ${name} could not be created.`);
      console.error(err);
    }

    return null;
  }

  getPathExpression(hasLine) {
    if (hasLine) {
      if (process.platform === "win32") {
        return "(?:[a-z]:\\\\|\\\\)?[\\w\\.\\-]+[\\\\[\\w\\.\\-]+]*";
      } else {
        return "(?:~\\/|\\/?)[\\w\\.\\-]+[\\/[\\w\\.\\-]+]*";
      }
    }

    if (process.platform === "win32") {
      return "(?:[a-z]:\\\\|\\\\)?(?:[\\w\\.\\-]+\\\\)+[\\w\\.\\-]+";
    }

    return "(?:~\\/|\\/?)(?:[\\w\\.\\-]+\\/)+[\\w\\.\\-]+";
  }

  editConfiguration() {
    if (this.configurationFile.isFile() && this.configurationFile.existsSync()) {
      return atom.workspace.open(this.configurationFile.getPath());
    }
  }

  fileSaved(path) {
    return Array.from(this.saveControllers).map((saveController) =>
      saveController.fileSaved(path));
  }

  getConfigController(namespace, action) {
    for (let configController of Array.from(this.configControllers)) {
      if ((configController.config.namespace === namespace) && (configController.config.action === action)) {
        return configController;
      }
    }

    return null;
  }
});
