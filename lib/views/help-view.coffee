{File} = require 'atom'
{View} = require 'atom-space-pen-views'

module.exports =
class HelpView extends View

  constructor: () ->
    super();

  @content: ->
    configFile = new File(atom.config.getUserConfigPath());
    configFolder = configFile.getParent().getRealPathSync();

    @div {class: "help"}, =>
      @h2 {class: "header"}, 'Process Palette'
      @div {class: "content"}, =>
        @div =>
          @span "Add commands by creating a "
          @span "process-palette.json", {class: "text-info"}
          @span " configuration file in any of the following:"
        @ul =>
          @li =>
            @span "Your "
            @span "#{configFolder}", {class: "text-info"}
            @span " folder for global commands "
            @button "Do it!", {class:'btn btn-sm inline-block-tight', click:'createConfigurationFile'}
          @li "The root of any of your project folders for project specific commands"
        @span "Once you've created a configuration file, run "
        @span "Process Palette: Reload Configuration", {class: "inline-block highlight"}
        @span "to load it."

  createConfigurationFile: ->
    configFile = new File(atom.config.getUserConfigPath());
    configFolder = configFile.getParent();
    configFile = configFolder.getFile("process-palette.json");

    if !configFile.existsSync()
      configFile.create().then =>
        configFile.writeSync(@getExampleFileContent());
        atom.workspace.open(configFile.getPath());
    else
      atom.workspace.open(configFile.getPath());

  getExampleFileContent: ->
    return """
    {
      "commands" : [
        {
          "namespace" : "Process Palette",
          "action" : "List",
          "command" : "ls",
          "arguments" : ["-lh"],
          "cwd" : "{projectPath}",
          "keystroke" : "ctrl-alt-l",
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

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove();

  getElement: ->
    @element
