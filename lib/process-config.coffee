module.exports =
class ProcessConfig

  constructor: (object={}) ->
    @namespace = 'Process Palette';
    @action = null;
    @command = null;
    @arguments = [];
    @cwd = null;
    @keystroke = null;
    @outputTarget = 'console';
    @successOutput = '{stdout}';
    @errorOutput = '{stderr}';
    @fatalOutput = 'Failed to execute : {fullCommand}\n{stdout}\n{stderr}';
    @successMessage = 'Executed : {fullCommand}';
    @errorMessage = 'Executed : {fullCommand}\nReturned with code {exitStatus}\n{stderr}';
    @fatalMessage = 'Failed to execute : {fullCommand}\n{stdout}\n{stderr}';

    for key, val of object
      @[key] = val

  getCommandName: ->
    return @namespace + ":" + @action;

  getFullCommand: ->
    return @command + " " + @arguments.join(" ");

  outputToPanel: ->
    return @outputTarget == 'panel';
