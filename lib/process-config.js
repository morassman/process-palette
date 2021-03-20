/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProcessConfig;
const _ = require('underscore-plus');

module.exports =
(ProcessConfig = class ProcessConfig {

  constructor(object) {
    if (object == null) { object = {}; }
    this.namespace = 'process-palette';
    this.action = '';
    this.command = '';
    this.arguments = [];
    this.cwd = null;
    this.inputDialogs = [];
    this.env = {};
    this.keystroke = null;
    this.stream = false;
    this.outputTarget = 'panel';
    this.outputBufferSize = 80000;
    this.maxCompleted = 3;
    this.autoShowOutput = true;
    this.autoHideOutput = false;
    this.scrollLockEnabled = false;
    this.singular = false;
    this.promptToSave = true;
    // saveOption = [none, all, referenced]
    this.saveOption = 'none';
    this.patterns = ['default'];
    this.successOutput = '{stdout}';
    this.errorOutput = '{stdout}\n{stderr}';
    this.fatalOutput = 'Failed to execute : {fullCommand}\n{stdout}\n{stderr}';
    this.startMessage = '';
    this.successMessage = 'Executed : {fullCommand}';
    this.errorMessage = 'Executed : {fullCommand}\nReturned with code {exitStatus}\n{stderr}';
    this.fatalMessage = 'Failed to execute : {fullCommand}\n{stdout}\n{stderr}';
    this.menus = [];

    for (let key in object) {
      const val = object[key];
      this[key] = val;
    }

    if (!["panel", "editor", "file", "clipboard", "console", "void"].includes(this.outputTarget)) {
      this.outputTarget = "void";
    }

    if (!["none", "all", "referenced"].includes(this.saveOption)) {
      this.saveOption = "none";
    }

    // Do not allow streaming to the clipboard.
    if (this.outputTarget === "clipboard") {
      this.stream = false;
    }

    this.requireString('namespace', 'process-palette', false);
    this.requireString('action', '', false);
    this.requireString('command', '', false);
    this.requireString('cwd', null, true);
    this.requireString('keystroke', null, true);
    this.requireString('outputTarget', 'panel', false);
    this.requireString('successOutput', '{stdout}', true);
    this.requireString('errorOutput', '{stdout}\n{stderr}', true);
    this.requireString('startMessage', '', true);
    this.requireString('successMessage', 'Executed : {fullCommand}', true);
    this.requireString('errorMessage', 'Executed : {fullCommand}\nReturned with code {exitStatus}\n{stderr}', true);
    this.requireBoolean('promptToSave', true);
    this.requireBoolean('stream', false);
    this.requireBoolean('autoShowOutput', true);
    this.requireBoolean('autoHideOutput', false);
    this.requireBoolean('scrollLockEnabled', false);
    this.requireInteger('outputBufferSize', 80000, true);
    this.requireInteger('maxCompleted', 3, true);
    this.requireString('startScript', null, true);
    this.requireString('successScript', null, true);
    this.requireString('errorScript', null, true);
    this.requireBoolean('scriptOnStart', false);
    this.requireBoolean('scriptOnSuccess', false);
    this.requireBoolean('scriptOnError', false);

    this.checkArguments();
    this.checkInputDialogs();
    this.checkPatterns();
    this.checkMenus();
    this.checkNotifications();
  }

  isValid() {
    if (this.namespace.trim().length === 0) {
      return false;
    }
    if (this.action.trim().length === 0) {
      return false;
    }
    if (this.command.trim().length === 0) {
      return false;
    }
    return true;
  }

  requireString(name, defaultValue, allowNull) {
    const value = this[name];

    if (allowNull) {
      if (_.isNull(value)) {
        return;
      }

      if (_.isUndefined(value)) {
        this[name] = null;
        return;
      }
    }

    if (!_.isString(value)) {
      return this[name] = defaultValue;
    }
  }

  requireBoolean(name, defaultValue) {
    const value = this[name];

    if (!_.isBoolean(value)) {
      return this[name] = defaultValue;
    }
  }

  requireInteger(name, defaultValue, allowNull) {
    const value = this[name];

    if (allowNull) {
      if (_.isNull(value)) {
        return;
      }

      if (_.isUndefined(value)) {
        this[name] = null;
        return;
      }
    }

    if (!Number.isInteger(value)) {
      return this[name] = defaultValue;
    }
  }

  checkArguments() {
    if (!_.isArray(this.arguments)) {
      this.arguments = [];
      return;
    }

    return this.requireStringArray(this.arguments);
  }

  checkPatterns() {
    if (!_.isArray(this.patterns)) {
      this.patterns = ['default'];
      return;
    }

    return this.requireStringArray(this.patterns);
  }

  checkMenus() {
    if (!_.isArray(this.menus)) {
      this.menus = [];
    }

    this.requireStringArray(this.menus);
    return this.menus = this.removeEmptyStrings(this.menus);
  }

  requireStringArray(array) {
    return (() => {
      const result = [];
      for (let i = 0, end = array.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        if ((array[i] == null)) {
          result.push(array[i] = '');
        } else if (!_.isString(array[i])) {
          result.push(array[i] = array[i].toString());
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  removeEmptyStrings(array) {
    const result = [];
    for (let s of Array.from(array)) {
      if (s.length > 0) {
        result.push(s);
      }
    }
    return result;
  }

  checkInputDialogs() {
    if (!_.isArray(this.inputDialogs)) {
      this.inputDialogs = [];
      return;
    }

    const validInputDialogs = [];

    for (let inputDialog of Array.from(this.inputDialogs)) {
      if (_.isString(inputDialog.variableName)) {
        if ((inputDialog.message == null)) {
          inputDialog.message = '';
        } else {
          inputDialog.message = inputDialog.message.toString();
        }

        if ((inputDialog.initialInput == null)) {
          inputDialog.initialInput = '';
        } else {
          inputDialog.initialInput = inputDialog.initialInput.toString();
        }

        validInputDialogs.push(inputDialog);
      }
    }

    return this.inputDialogs = validInputDialogs;
  }

  checkNotifications() {
    // This is done for backwards compatibility. If the notifyOn? flags haven't
    // been defined then set them based on whether a message is configured.
    if ((this.startMessage == null)) {
      this.startMessage = '';
    }
    if ((this.successMessage == null)) {
      this.successMessage = '';
    }
    if ((this.errorMessage == null)) {
      this.errorMessage = '';
    }

    if ((this.notifyOnStart == null)) {
      this.notifyOnStart = this.startMessage.length > 0;
    }

    if ((this.notifyOnSuccess == null)) {
      this.notifyOnSuccess = this.successMessage.length > 0;
    }

    if ((this.notifyOnError == null)) {
      return this.notifyOnError = this.errorMessage.length > 0;
    }
  }

  getCommandName() {
    return this.namespace + ":" + this.action;
  }

  getHumanizedCommandName() {
    return _.humanizeEventName(this.getCommandName());
  }

  getFullCommand() {
    const full = this.command + " " + this.arguments.join(" ");
    return full.trim();
  }

  outputToPanel() {
    return this.outputTarget === 'panel';
  }
});
