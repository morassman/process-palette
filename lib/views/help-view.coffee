{File} = require 'atom'
{View} = require 'atom-space-pen-views'

Path = null

module.exports =
class HelpView extends View

  constructor: (@main) ->
    super(@main);

  @content: ->
    configFile = new File(atom.config.getUserConfigPath());
    configFolder = configFile.getParent().getRealPathSync();

    @div {class: "help"}, =>
      @h2 {class: "header"}, 'Process Palette'
      @div {class: "content"}, =>
        @div =>
          @span "Add commands by creating a "
          @span "process-palette.json", {class: "text-info"}
          @span " configuration file in any of the following locations:"
        @ul =>
          @li =>
            @span "Your "
            @span "#{configFolder}", {class: "text-info"}
            @span " folder for global commands "
            @button "Do it!", {class:'btn btn-sm inline-block-tight', outlet: 'globalButton', click:'createGlobalConfigurationFile'}
          @li =>
            @span "The root of any of your project folders for project specific commands "
            @button "Do it!", {class:'btn btn-sm inline-block-tight', outlet: 'projectButton', click:'createProjectConfigurationFile'}
        @span "Once you've created a configuration file, run "
        @span "Process Palette: Reload Configuration", {class: "btn btn-sm inline-block-tight", click:'reloadConfiguration'}
        @span "to load it."

  initialize: ->
    @globalButton.on 'mousedown', (e) -> e.preventDefault();
    @projectButton.on 'mousedown', (e) -> e.preventDefault();

  createGlobalConfigurationFile: ->
    configFile = new File(atom.config.getUserConfigPath());
    @main.guiEditConfiguration(true, '', configFile.getParent().getRealPathSync());

  createProjectConfigurationFile: ->
    @main.editConfiguration(false);

  createConfigurationFile: (configFolder) ->
    configFile = configFolder.getFile("process-palette.json");
    Path ?= require 'path'

    if !configFile.existsSync()
      packagePath = atom.packages.getActivePackage('process-palette').path
      file = new File(Path.join(packagePath, 'examples', 'process-palette.json'));

      file.read(false).then (content) =>
        configFile.create().then =>
          configFile.writeSync(content);
          atom.workspace.open(configFile.getPath());
    else
      atom.workspace.open(configFile.getPath());

  reloadConfiguration: ->
    @main.reloadConfiguration();

  serialize: ->

  destroy: ->
    @element.remove();

  getElement: ->
    @element
