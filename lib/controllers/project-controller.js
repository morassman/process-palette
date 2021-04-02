/** @babel */

const ProcessConfig = require('../process-config');
const SaveController = require('./save-controller');
const ConfigController = require('./config-controller');
const RegExpPattern = require('../pattern/regexp-pattern');
const ProjectView = require('../views/project-view');
const { Directory, File } = require('atom');

export default class ProjectController {

  constructor(main, projectPath) {
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
    this.view.remove();
  }

  clearControllers() {
    this.clearConfigControllers();
    this.clearSaveControllers();
  }

  clearConfigControllers() {
    for (let configController of this.configControllers) {
      this.view.removeConfigController(configController);
      configController.dispose();
    }

    this.configControllers = [];
  }

  clearSaveControllers() {
    for (let saveController of this.saveControllers) {
      saveController.dispose();
    }

    this.saveControllers = [];
  }

  saveFile() {
    // A ProjectController is created for each project, but that doesn't mean that
    // it has a configuration file. Only save if there is actually a file, otherwise
    // an empty file will be created.
    if (this.configurationFile.existsSync()) {
      const text = JSON.stringify(this.processConfigs, null, '  ');
      this.configurationFile.writeSync(text);
    }
  }

  loadFile() {
    this.clearControllers();

    if (!this.configurationFile.isFile() || !this.configurationFile.existsSync()) {
      return;
    }

    this.configurationFile.read(true).then(resolve => {
      this.parseFile(resolve);
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

      for (let command of commands) {
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
      for (let saveCommand of this.processConfigs.saveCommands) {
        const saveController = new SaveController(this.main, saveCommand);
        this.saveControllers.push(saveController);
      }
    }

    this.main.recreateTreeViewContextMenu();
  }

  getPatterns(names) {
    const result = [];

    if (!names) {
      return result;
    }

    for (let name of names) {
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
    this.addPattern("default", config);
  }

  addPattern(name, config) {
    const pattern = this.createRegExpPattern(name, config);

    if (pattern !== null) {
      this.patterns[name] = pattern;
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
      atom.workspace.open(this.configurationFile.getPath());
    }
  }

  fileSaved(path) {
    this.saveControllers.forEach((saveController) => saveController.fileSaved(path));
  }

  getConfigController(namespace, action) {
    for (let configController of this.configControllers) {
      if ((configController.config.namespace === namespace) && (configController.config.action === action)) {
        return configController;
      }
    }

    return null;
  }

}
