_ = require 'underscore-plus'

module.exports =
class ProcessConfig

  constructor: (object={}) ->
    @namespace = 'Process Palette';
    @action = '';
    @command = '';
    @arguments = [];
    @cwd = null;
    @inputDialogs = [];
    @env = {};
    @keystroke = null;
    @stream = false;
    @outputTarget = 'panel';
    @outputBufferSize = 80000;
    @maxCompleted = 3;
    @autoShowOutput = true;
    @autoHideOutput = false;
    @scrollLockEnabled = false;
    @singular = false;
    @promptToSave = true;
    # saveOption = [none, all, referenced]
    @saveOption = 'none';
    @patterns = ['default'];
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

    if @saveOption not in ["none", "all", "referenced"]
      @saveOption = "none";

    # Do not allow streaming to the clipboard.
    if @outputTarget == "clipboard"
      @stream = false;

    @requireString('namespace', 'Process Palette', false);
    @requireString('action', '', false);
    @requireString('command', '', false);
    @requireString('cwd', null, true);
    @requireString('keystroke', null, true);
    @requireString('outputTarget', 'panel', false);
    @requireString('successOutput', '{stdout}', true);
    @requireString('errorOutput', '{stdout}\n{stderr}', true);
    @requireString('successMessage', 'Executed : {fullCommand}', true);
    @requireString('errorMessage', 'Executed : {fullCommand}\nReturned with code {exitStatus}\n{stderr}', true);
    @requireBoolean('promptToSave', true);
    @requireBoolean('stream', false);
    @requireBoolean('autoShowOutput', true);
    @requireBoolean('autoHideOutput', false);
    @requireBoolean('scrollLockEnabled', false);
    @requireInteger('outputBufferSize', 80000, true);
    @requireInteger('maxCompleted', 3, true);
    @checkArguments();
    @checkInputDialogs();
    @checkPatterns();

  isValid: ->
    if @namespace.trim().length == 0
      return false;
    if @action.trim().length == 0
      return false;
    if @command.trim().length == 0
      return false;
    return true;

  requireString: (name, defaultValue, allowNull) ->
    value = @[name];

    if allowNull
      if _.isNull(value)
        return;

      if _.isUndefined(value)
        @[name] = null;
        return;

    if !_.isString(value)
      @[name] = defaultValue;

  requireBoolean: (name, defaultValue) ->
    value = @[name];

    if !_.isBoolean(value)
      @[name] = defaultValue;

  requireInteger: (name, defaultValue, allowNull) ->
    value = @[name];

    if allowNull
      if _.isNull(value)
        return;

      if _.isUndefined(value)
        @[name] = null;
        return;

    if !Number.isInteger(value)
      @[name] = defaultValue;

  checkArguments: ->
    if !_.isArray(@arguments)
      @arguments = [];
      return;

    @requireStringArray(@arguments);

  checkPatterns: ->
    if !_.isArray(@patterns)
      @patterns = ['default'];
      return;

    @requireStringArray(@patterns);

  requireStringArray: (array) ->
    for i in [0...array.length]
      if !array[i]?
        array[i] = '';
      else if !_.isString(array[i])
        array[i] = array[i].toString();

  checkInputDialogs: ->
    if !_.isArray(@inputDialogs)
      @inputDialogs = [];
      return;

    validInputDialogs = [];

    for inputDialog in @inputDialogs
      if _.isString(inputDialog.variableName)
        if !inputDialog.message?
          inputDialog.message = '';
        else
          inputDialog.message = inputDialog.message.toString();

        if !inputDialog.initialInput?
          inputDialog.initialInput = '';
        else
          inputDialog.initialInput = inputDialog.initialInput.toString();

        validInputDialogs.push(inputDialog);

    @inputDialogs = validInputDialogs;

  getCommandName: ->
    return @namespace + ":" + @action;

  getFullCommand: ->
    full = @command + " " + @arguments.join(" ");
    return full.trim();

  outputToPanel: ->
    return @outputTarget == 'panel';
