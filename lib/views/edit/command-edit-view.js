/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const { TextEditor } = require('atom')
const View = require('../view');
const TableEditView = require('./table-edit-view');
const PatternChooseView = require('./pattern-choose-view');
const showInsertVariableModal = require('../modals/insert-variable-modal');
const _ = require('underscore-plus');


export default class CommandEditView extends View {

  constructor(config, commandItemView) {
    super(false)
    this.config = config;
    this.commandItemView = commandItemView;
    this.command = commandItemView.getCommand();
    this.tabindexes = {}
    this.initialize()
  }

  headerRow(header) {
    return <tr>
      <td attributes={{ colspan: 3 }}><h2 className="text-highlight">{header}</h2></td>
    </tr>
  }

  subHeaderRow(header) {
    return <tr>
      <td attributes={{ colspan: 3 }}><h3 className="text-highlight">{header}</h3></td>
    </tr>
  }

  headerInfoRow(info) {
    return <tr>
      <td className="text-smaller text-subtle" attributes={{ colspan: 3 }}>{info}</td>
    </tr>
  }

  inputRow(ref, label, mini, insertVariable, showOutputVariables = false, addBraces = true) {
    return <tr>
      <td className="text-highlight process-palette-command-edit-view-first-column">{label}</td>
      <td>{this.textEditor(ref, mini)}</td>
      {insertVariable ? <td>{this.insertVariableButton(ref, showOutputVariables, addBraces)}</td> : <span />}
    </tr>
  }

  textEditor(ref, mini) {
    this.tabindex++
    const textEditor = <TextEditor ref={ref} mini={mini} softTabs={true} softWrapped={true} lineNumberGutterVisible={false} autoHeight={true} />
    this.tabindexes[ref] = this.tabIndex
    return textEditor
  }

  insertVariableButton(ref, showOutputVariables = false, addBraces = true) {
    this.tabindex++
    return <button className="btn btn-xs icon icon-code inline-block-tight" attributes={{ tabindex: this.tabindex }} on={{ click: () => this.insertVariable(ref, showOutputVariables, addBraces) }}>Insert Variable</button>
  }

  inputInfoRow(info) {
    return <tr>
      <td>{' '}</td>
      <td className="text-smaller text-subtle">{info}</td>
    </tr>
  }

  checkbox(label, ref) {
    this.tabindex++
    return <div attributes={{ style: "display: flex; align-items: center", colspan: 2 }}>
      <input ref={ref} type="checkbox" attributes={{ tabindex: this.tabindex }} />
      <span className="process-palette-command-edit-view-check-label">{label}</span>
    </div>
  }

  varDefRow(v, d) {
    return <tr>
      <td className="text-highlight process-palette-command-edit-view-first-column">{v}</td>
      <td>{d}</td>
    </tr>
  }

  render() {
    this.tabIndex = 0
    return <div>
      <div className="process-palette-command-edit-view">
        <table>
          <colgroup>
            <col span="1" style="width: 15%;" />
            <col span="1" style="width: 70%;" />
            <col span="1" style="width: 15%;" />
          </colgroup>
          <tbody>
            {this.headerRow("General")}

            {this.inputRow("namespaceEditor", "Namespace", true)}

            {this.inputRow("actionEditor", "Action Name", true)}
            {this.inputInfoRow("The namespace and action name together forms the identifier in the command palette. These should be lowercase and words separated by hyphens.")}

            {this.inputRow("commandEditor", "Shell Command", false, true)}
            {this.inputInfoRow("Command with arguments to run. Any of the input variables can be used.")}

            {this.inputRow("cwdEditor", "Working Directory", true, true)}
            {this.inputInfoRow("Working directory when running command. Any of the input variables can be used.")}

            {this.inputRow("keystrokeEditor", "Keystroke", true)}
            <tr>
              <td>{' '}</td>
              <td>
                <span className="text-smaller text-subtle">Shortcut key. Combine shift, ctrl, cmd and alt with other keys, like </span>
                <span className="text-smaller text-highlight">ctrl-alt-r</span>
              </td>
            </tr>

            {this.inputRow("menuEditor", "Menu", true)}
            <tr>
              <td>{' '}</td>
              <td>
                <span className="text-smaller text-subtle">A comma separated list of menu names like </span>
                <span className="text-smaller text-highlight">Processes, Global</span>
                <span className="text-smaller text-subtle">. The first name is the top level menu in Atom, followed by sub menus. Menus are created as needed and the action name is then placed in the last menu.</span>
              </td>
            </tr>

            {this.headerRow("Saving")}
            <tr>
              <td attributes={{ colspan: 2 }} className="text-smaller text-subtle">
                <span>It may be necessary to first save edited files before running a command. </span>
                <span>If that is the case then either all files can be saved or only those that are referenced by the command.</span>
              </td>
            </tr>

            <tr>
              <td className="text-highlight process-palette-command-edit-view-first-column">Save</td>
              <td>
                <select ref="saveSelect" className="form-control">
                  <option value={'none'}>None</option>
                  <option value={'all'}>All</option>
                  <option value={'referenced'}>Referenced</option>
                </select>
              </td>
            </tr>
            {this.inputInfoRow("Specify what needs to be saved before the command is executed.")}

            <tr>
              <td attributes={{ colspan: 2 }}>
                {this.checkbox("Prompt before saving", "promptToSaveCheck")}
              </td>
            </tr>

            {this.headerRow("Input")}
            {this.headerInfoRow("This text is sent to the process's standard input on execution.")}
            {this.inputRow("stdinEditor", "Input", false, true)}

            {this.headerRow("Output")}

            <tr>
              <td className="text-highlight process-palette-command-edit-view-first-column">Target</td>
              <td>
                <select ref="targetSelect" className="form-control">
                  <option value={'panel'}>Panel</option>
                  <option value={'terminal'}>Terminal</option>
                  <option value={'clipboard'}>Clipboard</option>
                  <option value={'console'}>Developer console</option>
                  <option value={'editor'}>Active editor</option>
                  <option value={'file'}>New file</option>
                  <option value={'void'}>Void</option>
                </select>
              </td>
            </tr>

            <tr>
              <td attributes={{ colspan: 2 }}>
                {this.checkbox("Stream output to target", "streamCheck")}
              </td>
            </tr>
            <tr>
              <td className="text-smaller text-subtle" attributes={{ colspan: 2 }}>
                Select to stream output to target as it is produced. If not selected then the output will be accumulated and sent to the target when the process ends.
              </td>
            </tr>

            {this.inputRow("bufferSizeEditor", "Buffer Size", true)}
            {this.inputInfoRow("The maximum number of characters to keep in memory. Leave unspecified to disable the limit.")}

            {this.subHeaderRow("Target Format")}
            {this.headerInfoRow("Format of output when written to the target. Any variable can be used here. The target format will not be applied if streaming is enabled.")}

            {this.inputRow("successOutputEditor", "Success", false, true, true)}
            {this.inputRow("errorOutputEditor", "Error", false, true, true)}

            {this.subHeaderRow("Notifications")}
            {this.headerInfoRow("Notifications can be shown at the start and end of a process. A more detailed message can optionally be configured for each notification that can reference any of the defined variables.")}


            <tr>
              <td className="th text-highlight">Notify on</td>
              <td className="th text-highlight">Detailed message (optional)</td>
            </tr>

            <tr>
              <td className="process-palette-command-edit-view-first-column">
                {this.checkbox("Start", "startNotifyCheck")}
              </td>
              <td>{this.textEditor("startMessageEditor", false)}</td>
              <td>{this.insertVariableButton("startMessageEditor", false)}</td>
            </tr>
            <tr>
              <td className="process-palette-command-edit-view-first-column">
                {this.checkbox("Success", "successNotifyCheck")}
              </td>
              <td>{this.textEditor("successMessageEditor", false)}</td>
              <td>{this.insertVariableButton("successMessageEditor", true)}</td>
            </tr>
            <tr>
              <td className="process-palette-command-edit-view-first-column">
                {this.checkbox("Error", "errorNotifyCheck")}
              </td>
              <td>{this.textEditor("errorMessageEditor", false)}</td>
              <td>{this.insertVariableButton("errorMessageEditor", true)}</td>
            </tr>

            {this.headerRow("Panel")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                {this.checkbox("Auto enable scroll lock", "scrollLockCheck")}
              </td>
            </tr>
            <tr>
              <td attributes={{ colspan: 2 }}>
                {this.checkbox("Auto show when process starts", "autoShowCheck")}
              </td>
            </tr>
            <tr>
              <td attributes={{ colspan: 2 }}>
                {this.checkbox("Auto hide when process completes", "autoHideCheck")}
              </td>
            </tr>

            {this.inputRow("maxCompletedEditor", "Maximum Completed", true)}
            {this.inputInfoRow("The maximum number of completed processes to keep. Leave empty to disable the limit.")}

            {this.headerRow("Processes")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                {this.checkbox("Terminate running process before running a new instance", "singularCheck")}
              </td>
            </tr>

            {this.headerRow("Patterns")}
            {this.headerInfoRow("Choose which patterns should be applied when detecting file paths. Patterns are applied from top to bottom.")}
            <tr>
              <td attributes={{ colspan: 3 }}>
                <PatternChooseView ref="patternChooseView" />
              </td>
            </tr>

            {this.headerRow("Environment Variables")}
            {this.headerInfoRow("Add additional environment variables. Any of Process Palette's input variables can be used in the value.")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                <TableEditView ref="envVarsView" columns={['Name', 'Value']} />
              </td>
            </tr>

            {this.headerRow("Input Dialogs")}
            {this.headerInfoRow("Input dialogs are used to define custom input variables. When running a command you will be prompted to enter a value for each. These input variables can be referenced like any of the others.")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                <TableEditView ref="inputDialogsView" columns={['Name', 'Message (optional)', 'Default value (optional)']} />
              </td>
            </tr>

            {this.headerRow("Scripts")}
            <tr>
              <td className="text-smaller text-subtle" attributes={{ colspan: 2 }}>
                Custom JavaScript can be executed at the start and end of a process. Any of the defined variables can be accessed without needing to use braces. Environment variables can be accessed with the env object, such as env['PWD'].
              </td>
            </tr>
            <tr>
              <td className="th text-highlight">Run on</td>
              <td className="th text-highlight">Script</td>
            </tr>
            <tr>
              <td className="process-palette-command-edit-view-first-column">
                {this.checkbox("Start", "startScriptCheck")}
              </td>
              <td>
                {this.textEditor("startScriptEditor", false, true)}
              </td>
              <td>
                {this.insertVariableButton("startScriptEditor", false, false)}
              </td>
            </tr>
            <tr>
              <td className="process-palette-command-edit-view-first-column">
                {this.checkbox("Success", "successScriptCheck")}
              </td>
              <td>
                {this.textEditor("successScriptEditor", false, true)}
              </td>
              <td>
                {this.insertVariableButton("successScriptEditor", true, false)}
              </td>
            </tr>
            <tr>
              <td className="process-palette-command-edit-view-first-column">
                {this.checkbox("Error", "errorScriptCheck")}
              </td>
              <td>
                {this.textEditor("errorScriptEditor", false, true)}
              </td>
              <td>
                {this.insertVariableButton("errorScriptEditor", true, false)}
              </td>
            </tr>

            {this.headerRow("Variables")}
            {this.headerInfoRow("Variables can be used in many of the fields. These should be surrounded with curly brackets when referenced, such as {filePath}.")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                <span className="text-smaller inline-block highlight-info">Tip!</span>
                <span className="text-smaller text-subtle">An easy way to see the value of a variable is to simply configure the shell command to echo it, like </span>
                <code className="text-smaller">{"echo '{configDirAbsPath}'"}</code>
              </td>
            </tr>

            {this.subHeaderRow("Input Variables")}
            {this.varDefRow("clipboard", "Text currently on clipboard.")}
            {this.varDefRow("fullCommand", "The full command along with its arguments. Both the command and arguments will have their variables resolved.")}
            {this.varDefRow("configDirAbsPath", "Absolute path of folder where the process-palette.json configuration file is that defines this command.")}
            {this.varDefRow("projectPath", "If projects are open then the first project\'s folder will be used. If there aren\'t any projects open then the path of the folder containing the process-palette.json file is used.")}
            {this.varDefRow("selectProjectPath", "Prompts to choose the path of one of the projects in the workspace.")}

            {this.subHeaderRow("Input Variables From Editor")}
            {this.varDefRow("fileExt", "Extension of file.")}
            {this.varDefRow("fileName", "Name of file without extension.")}
            {this.varDefRow("fileNameExt", "Name of file with extension.")}
            {this.varDefRow("filePath", "Path of file relative to project.")}
            {this.varDefRow("fileDirPath", "Path of file\'s directory relative to project.")}
            {this.varDefRow("fileAbsPath", "Absolute path of file.")}
            {this.varDefRow("fileDirAbsPath", "Absolute path of file\'s directory.")}
            {this.varDefRow("fileProjectPath", "Absolute path of file\'s project directory.")}
            {this.varDefRow("text", "The full content of the editor.")}
            {this.varDefRow("selection", "Currently selected text.")}
            {this.varDefRow("word", "Word under cursor.")}
            {this.varDefRow("token", "Token under cursor.")}
            {this.varDefRow("line", "Line at cursor.")}
            {this.varDefRow("lineNo", "Line number at cursor.")}

            {this.subHeaderRow("Output Variables")}
            {this.headerInfoRow("Output variables are only available after the command has run and can therefore only be used in the target and notification formats.")}
            {this.varDefRow("stdout", "Standard output produced by the process.")}
            {this.varDefRow("stderr", "Standard error output produced by the process.")}
            {this.varDefRow("exitStatus", "Exit status code returned by the process.")}
          </tbody>
        </table>
        <br />
      </div>
    </div>
  }

  initialize() {
    super.initialize()

    Object.keys(this.tabindexes).forEach(ref => {
      this.refs[ref].element.setAttribute('tabindex', this.tabindexes[ref])
    })

    this.refs.bufferSizeEditor.setPlaceholderText('Unspecified')
    this.refs.maxCompletedEditor.setPlaceholderText('Unspecified');

    this.refs.commandEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.successOutputEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.errorOutputEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.startMessageEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.successMessageEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.errorMessageEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.startScriptEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.successScriptEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.errorScriptEditor.element.classList.add('process-palette-multi-line-editor')
    this.refs.stdinEditor.element.classList.add('process-palette-multi-line-editor');

    this.showConfig();

    this.refs.namespaceEditor.onDidChange(() => this.nameChanged())
    this.refs.actionEditor.onDidChange(() => this.nameChanged());
  }

  nameChanged() {
    this.command.namespace = this.refs.namespaceEditor.getText().trim()
    this.command.action = this.refs.actionEditor.getText().trim();
    this.commandItemView.refreshName();
  }

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  // Populates the view with the config.
  showConfig() {
    this.refs.envVarsView.reset()
    this.refs.inputDialogsView.reset();

    this.refs.namespaceEditor.setText(this.command.namespace)
    this.refs.actionEditor.setText(this.command.action)
    this.refs.commandEditor.setText(this.appendArguments(this.command.command, this.command.arguments))
    this.refs.cwdEditor.setText(this.emptyString(this.command.cwd))
    this.refs.keystrokeEditor.setText(this.emptyString(this.command.keystroke))
    this.refs.menuEditor.setText(this.command.menus.join())
    this.refs.bufferSizeEditor.setText(this.emptyString(this.command.outputBufferSize))
    this.refs.stdinEditor.setText(this.emptyString(this.command.input))
    this.setChecked(this.refs.promptToSaveCheck, this.command.promptToSave)
    this.refs.saveSelect.value = this.command.saveOption
    this.setChecked(this.refs.streamCheck, this.command.stream)
    this.refs.targetSelect.value = this.command.outputTarget
    this.setChecked(this.refs.singularCheck, this.command.singular)
    this.setChecked(this.refs.scrollLockCheck, this.command.scrollLockEnabled)
    this.setChecked(this.refs.autoShowCheck, this.command.autoShowOutput)
    this.setChecked(this.refs.autoHideCheck, this.command.autoHideOutput)
    this.refs.maxCompletedEditor.setText(this.emptyString(this.command.maxCompleted))
    this.setMultiLineEditorText(this.refs.successOutputEditor, this.emptyString(this.command.successOutput))
    this.setMultiLineEditorText(this.refs.errorOutputEditor, this.emptyString(this.command.errorOutput))
    this.setChecked(this.refs.startNotifyCheck, this.command.notifyOnStart)
    this.setChecked(this.refs.successNotifyCheck, this.command.notifyOnSuccess)
    this.setChecked(this.refs.errorNotifyCheck, this.command.notifyOnError)
    this.setMultiLineEditorText(this.refs.startMessageEditor, this.emptyString(this.command.startMessage))
    this.setMultiLineEditorText(this.refs.successMessageEditor, this.emptyString(this.command.successMessage))
    this.setMultiLineEditorText(this.refs.errorMessageEditor, this.emptyString(this.command.errorMessage));

    this.setChecked(this.refs.startScriptCheck, this.command.scriptOnStart)
    this.setChecked(this.refs.successScriptCheck, this.command.scriptOnSuccess)
    this.setChecked(this.refs.errorScriptCheck, this.command.scriptOnError)
    this.setMultiLineEditorText(this.refs.startScriptEditor, this.emptyString(this.decode(this.command.startScript)))
    this.setMultiLineEditorText(this.refs.successScriptEditor, this.emptyString(this.decode(this.command.successScript)))
    this.setMultiLineEditorText(this.refs.errorScriptEditor, this.emptyString(this.decode(this.command.errorScript)));

    this.refs.patternChooseView.setPatterns(this.config.patterns, this.command.patterns);

    if (this.command.env !== null) {
      for (let name in this.command.env) {
        const value = this.command.env[name];
        this.refs.envVarsView.addRow([name, value]);
      }
    }

    if (this.command.inputDialogs !== null) {
      this.command.inputDialogs.forEach((inputDialog) => this.refs.inputDialogsView.addRow([inputDialog.variableName, inputDialog.message, inputDialog.initialInput]));
    }
  }

  encode(value) {
    if (!value) {
      return value;
    }

    return btoa(value);
  }

  decode(value) {
    if (!value) {
      return value;
    }

    return atob(value);
  }

  emptyString(value) {
    if (!value) {
      return '';
    }

    return value.toString();
  }

  appendArguments(command, args) {
    if (args.length > 0) {
      command += " " + args.join(" ");
    }

    return command;
  }

  setChecked(checkBox, checked) {
    if ((checked === null)) {
      checked = false;
    }

    if (checked !== checkBox.checked) {
      return checkBox.checked = checked;
    }
  }

  setMultiLineEditorText(editor, text) {
    text = text.replace('\\n', '\n');
    return editor.setText(text);
  }

  insertVariable(ref, showOutputVariables = false, addBraces = true) {
    showInsertVariableModal(this.refs[ref], showOutputVariables, addBraces)
  }

  persistChanges() {
    this.command.command = this.refs.commandEditor.getText().trim()
    this.command.arguments = []
    this.command.promptToSave = this.refs.promptToSaveCheck.checked
    this.command.saveOption = this.refs.saveSelect.value
    this.command.stream = this.refs.streamCheck.checked
    this.command.singular = this.refs.singularCheck.checked
    this.command.autoShowOutput = this.refs.autoShowCheck.checked
    this.command.autoHideOutput = this.refs.autoHideCheck.checked
    this.command.scrollLockEnabled = this.refs.scrollLockCheck.checked
    this.command.patterns = this.refs.patternChooseView.getSelectedPatterns()
    this.command.outputTarget = this.refs.targetSelect.value
    this.command.notifyOnStart = this.refs.startNotifyCheck.checked
    this.command.notifyOnSuccess = this.refs.successNotifyCheck.checked
    this.command.notifyOnError = this.refs.errorNotifyCheck.checked
    this.command.scriptOnStart = this.refs.startScriptCheck.checked
    this.command.scriptOnSuccess = this.refs.successScriptCheck.checked
    this.command.scriptOnError = this.refs.errorScriptCheck.checked
    this.persistStringNullIfEmpty('cwd', this.refs.cwdEditor.getText())
    this.persistStringNullIfEmpty('keystroke', this.refs.keystrokeEditor.getText())
    this.persistStringNullIfEmpty('input', this.refs.stdinEditor.getText())
    this.persistStringNullIfEmpty('successOutput', this.refs.successOutputEditor.getText())
    this.persistStringNullIfEmpty('errorOutput', this.refs.errorOutputEditor.getText())
    this.persistStringNullIfEmpty('startMessage', this.refs.startMessageEditor.getText())
    this.persistStringNullIfEmpty('successMessage', this.refs.successMessageEditor.getText())
    this.persistStringNullIfEmpty('errorMessage', this.refs.errorMessageEditor.getText())
    this.persistStringNullIfEmpty('startScript', this.encode(this.refs.startScriptEditor.getText()))
    this.persistStringNullIfEmpty('successScript', this.encode(this.refs.successScriptEditor.getText()))
    this.persistStringNullIfEmpty('errorScript', this.encode(this.refs.errorScriptEditor.getText()))

    this.persistIntegerNullIfNaN('outputBufferSize', this.refs.bufferSizeEditor.getText())
    this.persistIntegerNullIfNaN('maxCompleted', this.refs.maxCompletedEditor.getText())
    this.persistEnv()
    this.persistMenus()
    this.persistInputDialogs();
  }

  persistStringNullIfEmpty(name, value, emptyValue = null) {
    if (value.trim().length === 0) {
      this.command[name] = emptyValue;
    } else {
      this.command[name] = value;
    }
  }

  persistIntegerNullIfNaN(name, sValue) {
    let value = Number.parseInt(sValue.trim());

    if (_.isNaN(value)) {
      value = null;
    }

    this.command[name] = value;
  }

  persistMenus() {
    let menus = this.refs.menuEditor.getText().trim();

    if (menus.length === 0) {
      menus = [];
    } else {
      menus = menus.split(',');
    }

    this.command.menus = [];
    return (() => {
      const result = [];
      for (let menu of menus) {
        menu = menu.trim();
        if (menu.length > 0) {
          result.push(this.command.menus.push(menu));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  persistInputDialogs() {
    const inputDialogs = [];
    const rows = this.refs.inputDialogsView.getRows();

    for (let row of rows) {
      const inputDialog = {};
      inputDialog.variableName = row[0].trim();

      if (inputDialog.variableName.length > 0) {
        inputDialog.message = row[1].trim();
        inputDialog.initialInput = row[2].trim();
        inputDialogs.push(inputDialog);
      }
    }

    this.command.inputDialogs = inputDialogs;
  }

  persistEnv() {
    const env = {};
    const rows = this.refs.envVarsView.getRows();

    for (let row of rows) {
      const name = row[0].trim();

      if (name.length > 0) {
        env[name] = row[1];
      }
    }

    this.command.env = env;
  }
}
