ProcessConfig = require '../process-config'
SaveController = require './save-controller'
ConfigController = require './config-controller'
ProcessController = require './process-controller'
RegExpPattern = require '../pattern/regexp-pattern'
{Directory, File, BufferedProcess, CompositeDisposable} = require 'atom'
os = require 'os';

module.exports =
class ProjectController

  constructor: (@main, @projectPath) ->
    @configControllers = [];
    @saveControllers = [];
    @patterns = {};
    @configurationFile = new Directory(@projectPath).getFile('process-palette.json');
    @loadFile();

  getMain: ->
    return @main;

  dispose: ->
    @clearControllers();

  clearControllers: ->
    @clearConfigControllers();
    @clearSaveControllers();

  clearConfigControllers: ->
    for configController in @configControllers
      @main.mainView.removeConfigController(configController);
      configController.dispose();

    @configControllers = [];

  clearSaveControllers: ->
    for saveController in @saveControllers
      saveController.dispose();

    @saveControllers = [];

  loadFile: ->
    @clearControllers();

    if (!@configurationFile.isFile() or !@configurationFile.existsSync())
      return;

    @configurationFile.read(true).then (resolve) =>
      @parseFile(resolve);

  parseFile: (content) ->
    processConfigs = JSON.parse(content);

    if !processConfigs?
      return;

    patterns = processConfigs.patterns;
    commands = processConfigs.commands;
    saveCommands = processConfigs.saveCommands;

    if patterns?
      for key, value of patterns
        @addPattern(key, value);

    if commands?
      for command in commands
        configController = new ConfigController(@, new ProcessConfig(command));
        @configControllers.push(configController);
        @main.mainView.addConfigController(configController);

    if saveCommands?
      for saveCommand in saveCommands
        saveController = new SaveController(@main, saveCommand);
        @saveControllers.push(saveController);

  getPatterns: (names) ->
    result = [];

    if !names?
      return result;

    for name in names
      pattern = @patterns[name];

      if pattern
        result.push(pattern);

    return result;

  addPattern: (name, config) ->
    if !config.type?
      config.type = "regexp";

    pattern = null;

    if config.type == "regexp"
      pattern = @createRegExpPattern(name, config);
    else
      console.error("Pattern #{name} has an invalid type #{config.type}.")
      return;

    if pattern != null
      @patterns[name] = pattern;

  createRegExpPattern: (name, config) ->
    if !config.pattern?
      console.error("Pattern #{name} has not value for pattern.")
      return null;

    if !config.flags?
      config.flags = "i";

    if config.pattern.indexOf("(path)") > -1
      return @createNativePattern(name, config);

    try
      return new RegExpPattern(config);
    catch err
      console.error("Pattern #{name} could not be created.");
      console.error(err);

    return null;

  createNativePattern: (name, config) ->
    pathIndex = config.pattern.indexOf("(path)");
    lineIndex = config.pattern.indexOf("(line)");

    config.path = 1;

    if lineIndex > -1
      config.pattern = config.pattern.replace("(line)", "(\\d+)");
      if pathIndex < lineIndex
        config.line = 2;
      else
        config.line = 1;
        config.path = 2;

    if config.line?
      if os.platform == "win32"
        config.pattern = config.pattern.replace("(path)", "((?:[a-z]:\\\\|\\\\)?[\\w\\.\\-]+[\\\\[\\w\\.\\-]+]*)")
      else
        config.pattern = config.pattern.replace("(path)", "(\\/?[\\w\\.\\-]+[\\/[\\w\\.\\-]+]*)")
    else
      if os.platform == "win32"
        config.pattern = config.pattern.replace("(path)", "((?:[a-z]:\\\\|\\\\)?(?:[\\w\\.\\-]+\\\\)+[\\w\\.\\-]+)")
      else
        config.pattern = config.pattern.replace("(path)", "(\\/?(?:[\\w\\.\\-]+\\/)+[\\w\\.\\-]+)")

    try
      return new RegExpPattern(config);
    catch err
      console.error("Pattern #{name} could not be created.");
      console.error(err);

    return null;

  editConfiguration: ->
    if (@configurationFile.isFile() and @configurationFile.existsSync())
      atom.workspace.open(@configurationFile.getPath());

  fileSaved: (path) =>
    for saveController in @saveControllers
      saveController.fileSaved(path);

  getConfigController: (namespace, action) =>
    for configController in @configControllers
      if (configController.config.namespace == namespace) and (configController.config.action == action)
        return configController;

    return null;
