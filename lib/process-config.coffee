module.exports =
class ProcessConfig

  constructor: (object={}) ->
    @namespace = 'Process Palette';
    @action = null;
    @command = null;
    @arguments = [];
    @cwd = null;
    @env = {};
    @keystroke = null;
    @stream = false;
    @outputTarget = 'panel';
    @outputBufferSize = 80000;
    @maxCompleted = 3;
    # @maxRunning = null;
    @autoShowOutput = true;
    @autoHideOutput = false;
    @scrollLockEnabled = false;
    @successOutput = '{stdout}';
    @errorOutput = '{stdout}\n{stderr}';
    @fatalOutput = 'Failed to execute : {fullCommand}\n{stdout}\n{stderr}';
    @successMessage = 'Executed : {fullCommand}';
    @errorMessage = 'Executed : {fullCommand}\nReturned with code {exitStatus}\n{stderr}';
    @fatalMessage = 'Failed to execute : {fullCommand}\n{stdout}\n{stderr}';

    for key, val of object
      @[key] = val

    if @outputTarget not in ["panel", "editor", "file", "clipboard", "console", "void"]
      @outputTarget = "void";

    # Do not allow streaming to the clipboard.
    if @outputTarget == "clipboard"
      @stream = false;

    if !@arguments
      @arguments = [];

  getCommandName: ->
    return @namespace + ":" + @action;

  getFullCommand: ->
    full = @command + " " + @arguments.join(" ");
    return full.trim();

  outputToPanel: ->
    return @outputTarget == 'panel';
