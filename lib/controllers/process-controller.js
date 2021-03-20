/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProcessController;
const _ = require('underscore-plus');
const psTree = require('ps-tree');
const shell = require('shelljs');
const {Directory, File} = require('atom');
const {$$} = require('atom-space-pen-views');
const ProcessConfig = require('../process-config');
const ProcessOutputView = require('../views/process-output-view');
const InputDialogView = require('../views/input-dialog-view');
const ProjectSelectView = require('../views/project-select-view');
const Buffer = require('./buffer');
const cp = require('child_process');
const {allowUnsafeNewFunction} = require('loophole');

// Fields :
// stdout : Standard output.
// stderr : Standard error output.
// exitStatus : Code returned by command.
// clipboard : Text currently on clipboard.
// fullCommand : The full command along with its arguments.
// configDirAbsPath : Absolute path of folder that the configuration file is in.
// projectPath : Absolute path of project folder.
//
// Only if a file is currently open :
// fileExt : Extension of file.
// fileName : Name of file without extension.
// fileNameExt : Name of file with extension.
// filePath : Path of file relative to project.
// fileDirPath : Path of file's directory relative to project.
// fileAbsPath : Absolute path of file.
// fileDirAbsPath : Absolute path of file's directory.
// selection : Currently selected text.
// fileProjectPath : Absolute path of project folder.

module.exports =
(ProcessController = (function() {
  ProcessController = class ProcessController {
    static initClass() {
  
      this.config  = null;
      this.disposable  = null;
      this.process  = null;
      this.processCallbacks  = null;
      
    }

    constructor(configController, config) {
      this.processStopped = this.processStopped.bind(this);
      this.configController = configController;
      this.config = config;
      this.processCallbacks = [];
      this.replaceRegExp = new RegExp("{.*?}","g");
      this.fields = {};
      this.options = {};
      this.newFile = null;
      this.creatingNewFile = false;
      this.newFileDisposable = null;
      this.endTime = null;
      this.outputView = null;
      this.stdoutBuffer = new Buffer(this.config.outputBufferSize);
      this.stderrBuffer = new Buffer(this.config.outputBufferSize);
      this.killed = false;
      this.exitStatus = null;
      this.autoDiscard = false;

      if (this.config.outputTarget === "panel") {
        this.outputView = new ProcessOutputView(this.configController.getMain(), this);
      }
    }

    getProcessID() {
      return this.processID;
    }

    isKilled() {
      return this.killed;
    }

    getExitStatus() {
      return this.exitStatus;
    }

    dispose() {
      // TODO : The key binding should preferably be removed, but atom.keymaps.findKeyBindings throws an error.
      if (this.newFileDisposable != null) {
        this.newFileDisposable.dispose();
      }
      return (this.outputView != null ? this.outputView.destroy() : undefined);
    }

    showProcessOutput() {
      return this.configController.getMain().showProcessOutput(this);
    }

    hasBeenRemoved() {
      return this.configController.getMain().processControllerRemoved(this);
    }

    runProcessWithFile(filePath) {
      // Return if there is already a process running.
      if (this.process != null) {
        return;
      }

      this.fields = {};
      this.options = {};

      this.fields.clipboard = atom.clipboard.read();
      this.fields.configDirAbsPath = this.configController.projectController.projectPath;
      this.fields.stdout = "";
      this.fields.stderr = "";
      this.fields.selectProjectPath = "";

      const projectPaths = atom.project.getPaths();

      if (projectPaths.length > 0) {
        this.fields.projectPath = projectPaths[0];
      } else {
        this.fields.projectPath = this.configController.projectController.projectPath;
      }

      const editor = atom.workspace.getActiveTextEditor();

      if (editor) {
        const token = editor.tokenForBufferPosition(editor.getCursorBufferPosition());
        this.fields.text = editor.getText();
        this.fields.selection = editor.getSelectedText();
        this.fields.word = editor.getWordUnderCursor();
        this.fields.token = token ? token.value : "";
        const lastCursor = editor.getLastCursor();
        if (lastCursor != null) {
          this.fields.line = lastCursor.getCurrentBufferLine();
          this.fields.lineNo = lastCursor.getBufferRow() + 1;
        } else {
          this.fields.line = 1;
          this.fields.lineNo = '';
        }
      }

      if (filePath) {
        const file = new File(filePath);

        const nameExt = this.splitFileName(file.getBaseName());
        this.fields.fileName = nameExt[0];
        this.fields.fileExt = nameExt[1];

        this.fields.fileNameExt = file.getBaseName();
        this.fields.fileAbsPath = file.getRealPathSync();
        this.fields.fileDirAbsPath = file.getParent().getRealPathSync();

        let relPaths = atom.project.relativizePath(this.fields.fileAbsPath);
        this.fields.fileProjectPath = relPaths[0];
        this.fields.filePath = relPaths[1];

        relPaths = atom.project.relativizePath(this.fields.fileDirAbsPath);
        this.fields.fileDirPath = relPaths[1];
      } else {
        this.fields.fileName = "";
        this.fields.fileExt = "";
        this.fields.fileNameExt = "";
        this.fields.fileAbsPath = "";
        this.fields.fileDirAbsPath = "";
        this.fields.filePath = "";
        this.fields.fileDirPath = "";
        this.fields.fileProjectPath = "";
      }

      return this.saveDirtyFiles();
    }


    // Return true if the execution should continue. false if the user canceled.
    saveDirtyFiles() {
      if (this.config.saveOption === 'none') {
        return this.runProcessAfterSave();
      } else if (this.config.saveOption === 'all') {
        return this.saveEditors(this.getAllDirtyEditors());
      } else if (this.config.saveOption === 'referenced') {
        return this.saveEditors(this.getReferencedDirtyEditors());
      } else {
        return this.runProcessAfterSave();
      }
    }


    getAllDirtyEditors() {
      const result = [];

      for (let editor of Array.from(atom.workspace.getTextEditors())) {
        if (this.isEditorDirty(editor)) {
          result.push(editor);
        }
      }

      return result;
    }

    getReferencedDirtyEditors() {
      const result = [];

      if (this.fields.fileAbsPath.length === 0) {
        return result;
      }

      if (!this.commandDependsOnFile()) {
        return result;
      }

      const editor = this.getEditorWithPath(this.fields.fileAbsPath);

      if (this.isEditorDirty(editor)) {
        result.push(editor);
      }

      return result;
    }

    // Return true of the command to run references either {filePath} or {fileAbsPath}
    commandDependsOnFile() {
      return this.config.command.includes('{filePath}') || this.config.command.includes('{fileAbsPath}');
    }

    isEditorDirty(editor) {
      if ((editor == null)) {
        return false;
      }

      return editor.isModified() && (editor.getTitle() !== 'untitled');
    }

    getEditorWithPath(path) {
      const relPath = atom.project.relativizePath(path)[1];

      for (let editor of Array.from(atom.workspace.getTextEditors())) {
        if (relPath === atom.project.relativizePath(editor.getPath())[1]) {
          return editor;
        }
      }

      return null;
    }

    saveEditors(editors) {
      if (editors.length === 0) {
        this.runProcessAfterSave();
        return;
      }

      let option = 'yes';

      if (this.config.promptToSave) {
        option = this.promptToSave(editors);
      }

      if (option === 'cancel') {
        return;
      } else if (option === 'no') {
        this.runProcessAfterSave();
        return;
      }

      const promises = editors.map(e => e.save());

      return Promise.all(promises).then(results => {
        return this.runProcessAfterSave();
    }).catch(error => console.error(error));
    }

    // Prompt to ask if editors should be saved. Return 'yes', 'no' or 'cancel'
    promptToSave(editors) {
      const parts = ['The following files have been modified :\n'];
      for (let editor of Array.from(editors)) {
        parts.push(' - '+editor.getTitle());
      }
      parts.push('\nSave changes before running?');

      const options = {};
      options.message = 'Save Changes';
      options.detailedMessage = parts.join('\n');
      options.buttons = ['Yes', 'No', 'Cancel'];

      const choice = atom.confirm(options);
      return options.buttons[choice].toLowerCase();
    }

    runProcessAfterSave() {
      return this.takeUserInput(this.config.inputDialogs);
    }

    takeUserInput(inputDialogs) {
      if (inputDialogs.length > 0) {
        const inputDialogParams = inputDialogs[0];
        new InputDialogView(this.insertFields(inputDialogParams.message != null ? inputDialogParams.message : ""),
          this.insertFields(inputDialogParams.initialInput != null ? inputDialogParams.initialInput : ""), inputText => {
            this.fields[inputDialogParams.variableName] = inputText;
            return this.takeUserInput(inputDialogs.slice(1));
        });
        return;
      }

      return this.runProcessAfterUserInput();
    }

    runProcessAfterUserInput() {
      if (this.config.command.indexOf("selectProjectPath") !== -1) {
        return this.takeProjectInput();
      } else {
        return this.runProcessAfterProjectInput();
      }
    }

    takeProjectInput() {
      const callback = value => this.projectInputCallback(value);
      return new ProjectSelectView(callback, true);
    }

    projectInputCallback(value) {
      if (value != null) {
        this.fields.selectProjectPath = value;
      }

      return this.runProcessAfterProjectInput();
    }

    runProcessAfterProjectInput() {
      let notifOptions;
      if (this.config.cwd) {
        this.options.cwd = this.insertFields(this.config.cwd);
      } else {
        this.options.cwd = this.fields.projectPath;
      }

      const command = this.insertFields(this.config.command);

      const args = [];
      for (let argument of Array.from(this.config.arguments)) {
        args.push(this.insertFields(argument));
      }

      this.fields.fullCommand = command;

      if (args.length > 0) {
        this.fields.fullCommand += " " + args.join(" ");
        this.fields.fullCommand = this.fields.fullCommand.trim();
      }

      this.envBackup = {};
      this.pwdBackup = shell.pwd();

      if (this.config.env !== null) {
        for (let key in this.config.env) {
          const val = this.config.env[key];
          this.envBackup[key] = shell.env[key];
          shell.env[key] = this.insertFields(val);
        }
      }

      if (this.options.cwd) {
        this.options.cwd = this.options.cwd.trim();
        if (this.options.cwd.length > 0) {
          shell.cd(this.options.cwd);
        }
      }

      let pathToShell = atom.config.get("process-palette.shell");

      const execOptions = {silent:true, async:true};

      if (pathToShell != null) {
        pathToShell = pathToShell.trim();

        if (pathToShell.length > 0) {
          execOptions["shell"] = pathToShell;
        }
      }

      try {
        this.process = shell.exec(this.fields.fullCommand, execOptions, code => {
          this.fields.exitStatus = code;
          return this.processStopped((code == null));
        });
      } catch (e) {
        console.log(e);
      }

      if ((this.process == null)) {
        notifOptions = {};
        notifOptions["dismissable"] = true;
        notifOptions["detail"] = `Could not execute command '${this.fields.fullCommand}'`;
        atom.notifications.addWarning(`Error executing ${this.config.namespace}: ${this.config.action}`, notifOptions);
        return;
      }

      this.processID = this.process.pid;

      this.process.stdout.on("data", data => {
        this.stdoutBuffer.push(data);
        if (this.config.stream) {
          return this.streamOutput(data);
        }
      });

      this.process.stderr.on("data", data => {
        this.stderrBuffer.push(data);
        if (this.config.stream) {
          return this.streamOutput(data);
        }
      });

      if (this.config.notifyOnStart) {
        notifOptions = {};
        notifOptions["detail"] = this.insertFields(this.config.startMessage);
        const messageTitle = 'Running ' + _.humanizeEventName(this.config.getCommandName());
        atom.notifications.addInfo(messageTitle, notifOptions);
      }

      if (this.config.scriptOnStart) {
        this.runScript('start', this.config.startScript);
      }

      if (this.config.input) {
        this.process.stdin.write(this.insertFields(this.config.input));
        this.process.stdin.uncork();
        this.process.stdin.end();
      }

      return this.processStarted();
    }

    getCwd() {
      return this.options.cwd;
    }

    splitFileName(fileNameExt) {
      const index = fileNameExt.lastIndexOf(".");

      if (index === -1) {
        return [fileNameExt, ""];
      }

      return [fileNameExt.substr(0, index), fileNameExt.substr(index+1)];
    }

    insertFields(text) {
      return text.replace(this.replaceRegExp, this.createReplaceCallback());
    }

    createReplaceCallback() {
      return text => {
        return this.pipeField(text.slice(1,-1));
      };
    }

    pipeField(text) {
      const parts = text.split('|');
      const fieldName = parts[0].trim();
      let value = this.fields[fieldName];

      if ((value == null)) {
        value = '';
      }

      if (parts.length === 2) {
        value = this.pipeValue(value, parts[1].trim());
      }

      return value;
    }

    pipeValue(value, filter) {
      if ((filter === 'posix') || (filter === 'unix')) {
        return value.split('\\').join('/');
      } else if (filter === 'win') {
        return value.split('/').join('\\');
      } else if (filter === 'trim') {
        return value.trim();
      }

      return value;
    }

    addProcessCallback(callback) {
      return this.processCallbacks.push(callback);
    }

    removeProcessCallback(callback) {
      const index = this.processCallbacks.indexOf(callback);

      if (index !== -1) {
        return this.processCallbacks.splice(index, 1);
      }
    }

    discard() {
      if ((this.process == null)) {
        return this.configController.removeProcessController(this);
      }
    }

    killProcess(discard) {
      if (discard == null) { discard = false; }
      if (this.process === null) {
        return;
      }

      this.autoDiscard = discard;

      try {
        if (process.platform === "win32") {
          return this.killWindowsProcess();
        } else {
          return this.killLinuxProcess();
        }
      } catch (err) {
        this.process.kill();
        return console.log(err);
      }
    }

    killWindowsProcess() {
      const parentProcess = this.process;
      const killProcess = cp.spawn("taskkill", ["/pid",  this.process.pid, '/f', '/t']);

      killProcess.on("error", err => {
        parentProcess.kill();
        return console.log(err);
      });

      return killProcess.on("close", () => {
        return parentProcess.kill();
      });
    }

    killLinuxProcess() {
      return psTree(this.process.pid, (err, children) => {
        const parentProcess = this.process;
        const killProcess = cp.spawn("kill", ["-9"].concat(children.map(p => p.PID)));

        killProcess.on("error", err => {
          parentProcess.kill();
          return console.log(err);
        });

        return killProcess.on("close", () => {
          return parentProcess.kill();
        });
      });
    }

    streamOutput(output) {
      this.outputToTarget(output, true);

      return (() => {
        const result = [];
        for (let processCallback of Array.from(this.processCallbacks)) {
          if (typeof processCallback.streamOutput === "function") {
            result.push(processCallback.streamOutput(output));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    }

    processStarted() {
      this.configController.notifyProcessStarted(this);
      return _.invoke(_.clone(this.processCallbacks), "processStarted");
    }

    processStopped(killed) {
      this.process = null;
      this.endTime = Date.now();
      this.killed = killed;
      this.exitStatus = this.fields.exitStatus;
      let output = "";
      const messageTitle = _.humanizeEventName(this.config.getCommandName());
      this.fields.stdout = this.stdoutBuffer.toString();
      this.fields.stderr = this.stderrBuffer.toString();

      this.stdoutBuffer.clear();
      this.stderrBuffer.clear();

      const notifOptions = {};

      if (!killed) {
        if (this.fields.exitStatus === 0) {
          if (this.config.notifyOnSuccess) {
            notifOptions["detail"] = this.insertFields(this.config.successMessage);
            atom.notifications.addSuccess(messageTitle, notifOptions);
          }
          if (this.config.scriptOnSuccess) {
            this.runScript('success', this.config.successScript);
          }
        } else {
          if (this.config.notifyOnError) {
            notifOptions["dismissable"] = true;
            notifOptions["detail"] = this.insertFields(this.config.errorMessage);
            atom.notifications.addWarning(messageTitle, notifOptions);
          }
          if (this.config.scriptOnError) {
            this.runScript('error', this.config.errorScript);
          }
        }
      }

      if (!this.config.stream) {
        if (this.fields.exitStatus === 0) {
          if (this.config.successOutput != null) {
            output = this.insertFields(this.config.successOutput);
          }
        } else {
          if (this.config.errorOutput != null) {
            output = this.insertFields(this.config.errorOutput);
          }
        }

        this.outputToTarget(output, false);
      }

      for (let key in this.envBackup) {
        const val = this.envBackup[key];
        if (_.isUndefined(this.envBackup[key])) {
          delete shell.env[key];
        } else {
          shell.env[key] = this.envBackup[key];
        }
      }

      shell.cd(this.pwdBackup);

      this.fields = {};

      this.configController.notifyProcessStopped(this);
      _.invoke(_.clone(this.processCallbacks), "processStopped");

      if (this.autoDiscard) {
        return this.discard();
      }
    }

    outputToTarget(output, stream) {
      if (this.config.outputTarget === "editor") {
        const editor = atom.workspace.getActiveTextEditor();

        if (editor != null) {
          return editor.insertText(output);
        }
      } else if (this.config.outputTarget === "clipboard") {
        return atom.clipboard.write(output);
      } else if (this.config.outputTarget === "console") {
        return console.log(output);
      } else if (this.config.outputTarget === "panel") {
        return this.outputToPanel(output);
      } else if (this.config.outputTarget === "file") {
        return this.outputToNewFile(output);
      }
    }

    openNewFile(text) {
      this.creatingNewFile = true;

      return atom.workspace.open().then(textEditor => {
        this.newFile = textEditor;
        this.creatingNewFile = false;

        this.newFileDisposable = this.newFile.onDidDestroy(() => {
          return this.newFileDestroyed();
        });

        this.outputToNewFile(text);

        // It's possible for the text editor to open only after the process has stopped.
        if (this.process === null) {
          return this.cleanUpNewFileAfterProcess();
        }
      });
    }

    newFileDestroyed() {
      this.newFile = null;
      if (this.newFileDisposable != null) {
        this.newFileDisposable.dispose();
      }
      this.newFileDisposable = null;

      if (this.process === null) {
        return this.configController.removeProcessController(this);
      }
    }

    outputToNewFile(text) {
      if (this.creatingNewFile) {
        return;
      }

      if (this.newFile === null) {
        return this.openNewFile(text);
      } else {
        return this.newFile.insertText(text);
      }
    }

    outputToPanel(text) {
      return this.outputView.outputToPanel(text);
    }

    showNewFile() {
      if (this.newFile === null) {
        return;
      }

      const pane = atom.workspace.paneForItem(this.newFile);
      return (pane != null ? pane.activateItem(this.newFile) : undefined);
    }

    runScript(target, script) {
      if ((script == null)) {
        return;
      }

      const argNames = [];
      const argValues = [];

      for (let key in this.fields) {
        const val = this.fields[key];
        argNames.push(key);
        argValues.push(val);
      }

      argNames.push('env');
      argValues.push(shell.env);

      try {
        script = atob(script);

        return allowUnsafeNewFunction(function() {
          const f = new Function(argNames.join(','), script);
          return f.apply(null, argValues);
        });
      } catch (e) {
        const message = "The 'on " + target + "' JavaScript could not be executed. " + e.message;
        const warning = `Error executing script for ${this.config.namespace}: ${this.config.action}`;

        const notifOptions = {};
        notifOptions["dismissable"] = true;
        notifOptions["detail"] = message;
        return atom.notifications.addWarning(warning, notifOptions);
      }
    }
  };
  ProcessController.initClass();
  return ProcessController;
})());
