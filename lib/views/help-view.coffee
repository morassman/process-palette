{Directory, File} = require 'atom'
{View} = require 'atom-space-pen-views'

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
            @button "Do it!", {class:'btn btn-sm inline-block-tight', click:'createGlobalConfigurationFile'}
          @li =>
            @span "The root of any of your project folders for project specific commands "
            @button "Do it!", {class:'btn btn-sm inline-block-tight', click:'createProjectConfigurationFile'}
        @span "Once you've created a configuration file, run "
        @span "Process Palette: Reload Configuration", {class: "btn btn-sm inline-block-tight", click:'reloadConfiguration'}
        @span "to load it."

  createGlobalConfigurationFile: ->
    configFile = new File(atom.config.getUserConfigPath());
    configFolder = configFile.getParent();
    @createConfigurationFile(configFolder);

  createProjectConfigurationFile: ->
    for projectPath in atom.project.getPaths()
      @createConfigurationFile(new Directory(projectPath));

  createConfigurationFile: (configFolder) ->
    configFile = configFolder.getFile("process-palette.json");

    if !configFile.existsSync()
      configFile.create().then =>
        configFile.writeSync(@getExampleFileContent());
        atom.workspace.open(configFile.getPath());
    else
      atom.workspace.open(configFile.getPath());

  reloadConfiguration: ->
    @main.reloadConfiguration();

  getExampleFileContent: ->
    return """
    {
      "commands" : [
        {
          "namespace" : "Process Palette",
          "action" : "Echo",
          "command" : "echo",
          "arguments" : ["Hello", "$CUSTOM_VAR", "from", "{configDirAbsPath}"],
          "env" : {
            "CUSTOM_VAR" : "Atom"
          },
          "cwd" : "{projectPath}",
          "keystroke" : "ctrl-alt-l",
          "stream" : false,
          "outputTarget" : "panel",
          "successOutput" : "{stdout}",
          "errorOutput" : "{stderr}",
          "fatalOutput" : "Failed to execute : {fullCommand}\\n{stdout}\\n{stderr}",
          "successMessage" : "Executed : {fullCommand}",
          "errorMessage" : "Executed : {fullCommand}\\nReturned with code {exitStatus}\\n{stderr}",
          "fatalMessage" : "Failed to execute : {fullCommand}\\n{stdout}\\n{stderr}"
        }
      ]
    }
    """

  serialize: ->

  destroy: ->
    @element.remove();

  getElement: ->
    @element
