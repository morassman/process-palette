/** @babel */
/** @jsx etch.dom */

import { TextEditorView } from 'atom-space-pen-views'

const etch = require('etch')
const { CompositeDisposable, TextEditor } = require('atom')
const View = require('../view');
const TableEditView = require('./table-edit-view');
const PatternChooseView = require('./pattern-choose-view');
const InsertVariableView = require('./insert-variable-view');
const _ = require('underscore-plus');


export default class CommandEditView extends View {

  constructor(config, commandItemView) {
    super(false)
    this.config = config;
    this.commandItemView = commandItemView;
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

  inputRow(label, ref, mini, insertVariable, showOutputVariables = false, addBraces = true) {
    return <tr>
      <td className="text-highlight first-column">{label}</td>
      <td>{this.textEditor(ref, mini)}</td>
      {insertVariable ? <td>{this.insertVariableButton(ref, showOutputVariables, addBraces)}</td> : <span />}
    </tr>
  }

  textEditor(ref, mini) {
    return <TextEditor ref={ref} mini={mini} softTabs={true} softWrapped={true} lineNumberGutterVisible={false} />
  }

  insertVariableButton(ref, showOutputVariables = false, addBraces = true) {
    return <button className="btn btn-sm" on={{ click: () => this.insertVariable(ref, showOutputVariables, addBraces) }}>Insert Variable</button>
  }

  inputInfoRow(info) {
    return <tr>
      <td>{' '}</td>
      <td className="text-smaller text-subtle">{info}</td>
    </tr>
  }

  checkbox(label, ref) {
    return <div attributes={{ style: "display: flex; align-items: center", colspan: 2 }}>
      <input ref={ref} type="checkbox" />
      <span className="check-label">{label}</span>
    </div>
  }

  varDefRow(v, d) {
    return <tr>
      <td className="text-highlight first-column">{v}</td>
      <td>{d}</td>
    </tr>
  }

  render() {
    return <div>
      <div className="command-edit-view">
        <table>
          <colgroup>
            <col span="1" style="width: 15%;" />
            <col span="1" style="width: 70%;" />
            <col span="1" style="width: 15%;" />
          </colgroup>
          <tbody>
            {this.headerRow("General")}

            {this.inputRow("Namespace:", "namespaceEditor", true)}

            {this.inputRow("Action Name:", "actionEditor", true)}
            {this.inputInfoRow("The namespace and action name together forms the identifier in the command palette. These should be lowercase and words separated by hyphens")}

            {this.inputRow("Shell Command:", "commandEditor", false, true)}
            {this.inputInfoRow("Command with arguments to run. Any of the input variables can be used.")}

            {this.inputRow("Working Directory:", "cwdEditor", true, true)}
            {this.inputInfoRow("Working directory when running command. Any of the input variables can be used.")}

            {this.inputRow("Keystroke:", "keystrokeEditor", true)}
            <tr>
              <td>{' '}</td>
              <td>
                <span className="text-smaller text-subtle">Shortcut key. Combine shift, ctrl, cmd and alt with other keys, like </span>
                <span className="text-smaller text-highlight">ctrl-alt-r</span>
              </td>
            </tr>

            {this.inputRow("Menu:", "menuEditor", true)}
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
              <td className="text-highlight first-column">Save:</td>
              <td>
                <select>
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
            {this.inputRow("Input:", "stdinEditor", false, true)}

            {this.headerRow("Output")}

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

            <tr>
              <td className="text-highlight first-column">Target:</td>
              <td>
                <select>
                  <option value={'panel'}>Panel</option>
                  <option value={'clipboard'}>Clipboard</option>
                  <option value={'console'}>Developer console</option>
                  <option value={'editor'}>Active editor</option>
                  <option value={'file'}>New file</option>
                  <option value={'void'}>Void</option>
                </select>
              </td>
            </tr>

            {this.inputRow("Buffer Size:", "bufferSizeEditor", true)}
            {this.inputInfoRow("The maximum number of characters to keep in memory. Leave unspecified to disable the limit.")}

            {this.subHeaderRow("Target Format")}
            {this.headerInfoRow("Format of output when written to the target. Any variable can be used here. The target format will not be applied if streaming is enabled.")}

            {this.inputRow("Success:", "successOutputEditor", false, true, true)}
            {this.inputRow("Error:", "errorOutputEditor", false, true, true)}

            {this.subHeaderRow("Notifications")}
            {this.headerInfoRow("Notifications can be shown at the start and end of a process. A more detailed message can optionally be configured for each notification that can reference any of the defined variables.")}


            <tr>
              <td className="th text-highlight">Notify on</td>
              <td className="th text-highlight">Detailed message (optional)</td>
            </tr>

            <tr>
              <td className="first-column">
                {this.checkbox("Start", "startNotifyCheck")}
              </td>
              <td>{this.textEditor("startMessageEditor", false)}</td>
              <td>{this.insertVariableButton("startMessageEditor", false)}</td>
            </tr>
            <tr>
              <td className="first-column">
                {this.checkbox("Success", "successNotifyCheck")}
              </td>
              <td>{this.textEditor("successMessageEditor", false)}</td>
              <td>{this.insertVariableButton("successMessageEditor", true)}</td>
            </tr>
            <tr>
              <td className="first-column">
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

            {this.inputRow("Maximum Completed:", "maxCompletedEditor", true)}
            {this.inputInfoRow("The maximum number of panels of completed processes to keep. Leave unspecified to disable the limit.")}

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
                TODO: patternChooseView
                {/* <PatternChooseView ref="patternChooseView"/> */}
              </td>
            </tr>

            {this.headerRow("Environment Variables")}
            {this.headerInfoRow("Add additional environment variables. Any of Process Palette's input variables can be used in the value.")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                TODO: envVarsView
                {/* <TableEditView ref="envVarsView" columns={['Name', 'Value']}/> */}
              </td>
            </tr>

            {this.headerRow("Input Dialogs")}
            {this.headerInfoRow("Input dialogs are used to define custom input variables. When running a command you will be prompted to enter a value for each. These input variables can be referenced like any of the others.")}
            <tr>
              <td attributes={{ colspan: 2 }}>
                TODO: inputDialogsView
                {/* <TableEditView ref="inputDialogsView" columns={['Name', 'Message (optional)', 'Default value (optional)']}/> */}
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
              <td className="first-column">
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
              <td className="first-column">
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
              <td className="first-column">
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
            {this.varDefRow("token", "'Token under cursor.")}
            {this.varDefRow("line", "Line at cursor.")}
            {this.varDefRow("lineNo", "Line number at cursor.")}

            {this.subHeaderRow("Output Variables")}
            {this.headerInfoRow("Output variables are only available after the command has run and can therefore only be used in the target and notification formats.")}
            {this.varDefRow("stdout", "Standard output produced by the process.")}
            {this.varDefRow("stderr", "Standard error output produced by the process.")}
            {this.varDefRow("exitStatus", "Exit status code returned by the process.")}

          </tbody>
        </table>
      </div>
    </div>
  }

  static content() {
    return this.div(() => {
      return this.div({class:'command-edit-view'}, () => {
        return this.table(() => {
          return this.tbody(() => {
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('General', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              this.td('Namespace:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.subview('namespaceEditor', new TextEditorView({mini: true}));
              });
            });
            this.tr(() => {
              this.td('Action Name:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.subview('actionEditor', new TextEditorView({mini: true}));
              });
            });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                return this.span('The namespace and action name together forms the identifier in the command palette. These should be lowercase and words separated by hyphens.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Shell Command:', {class: 'text-highlight first-column'});
              this.td(() => {
                return this.subview('commandEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'commandInsertVariable'});
            });
          });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                return this.span('Command with arguments to run. Any of the input variables can be used.', {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Working Directory:', {class: 'text-highlight first-column'});
              this.td(() => {
                return this.subview('cwdEditor', new TextEditorView({mini: true}));
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'cwdInsertVariable'});
            });
          });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                return this.span('Working directory when running command. Any of the input variables can be used.', {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Keystroke:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.subview('keystrokeEditor', new TextEditorView({mini: true}));
              });
            });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                this.span('Shortcut key. Combine shift, ctrl, cmd and alt with other keys, like ', {class: 'text-smaller text-subtle'});
                return this.span('ctrl-alt-r', {class: 'text-smaller text-highlight'});
            });
          });
            this.tr(() => {
              this.td('Menu:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.subview('menuEditor', new TextEditorView({mini: true}));
              });
            });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                this.span('A comma separated list of menu names like ', {class: 'text-smaller text-subtle'});
                this.span('Processes, Global', {class: 'text-smaller text-highlight'});
                return this.span('. The first name is the top level menu in Atom, followed by sub menus. Menus are created as needed and the action name is then placed in the last menu.', {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Saving', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2, class: 'text-smaller text-subtle'}, () => {
                this.span('It may be necessary to first save edited files before running a command. ');
                return this.span('If that is the case then either all files can be saved or only those that are references by the command.');
              });
            });
            this.tr(() => {
              this.td('Save:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.select({class: 'form-control', outlet: 'saveSelect'}, () => {
                  this.option('None', {value: 'none'});
                  this.option('All', {value: 'all'});
                  return this.option('Referenced', {value: 'referenced'});
              });
            });
          });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                return this.span('Specify what needs to be saved before the command is executed.', {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                this.input({type: 'checkbox', outlet: 'promptToSaveCheck'});
                return this.span('Prompt before saving', {class: 'check-label'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Input', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2, class: 'text-smaller text-subtle'}, () => {
                return this.span('This text is sent to the process\'s standard input on execution.');
              });
            });
            this.tr(() => {
              this.td('Input', {class: 'text-highlight first-column'});
              this.td(() => {
                return this.subview('stdinEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'stdinInsertVariable'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Output', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                this.input({type: 'checkbox', outlet: 'streamCheck'});
                return this.span('Stream output to target', {class: 'check-label'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                return this.span('Select to stream output to target as it is produced. If not selected then the output will be accumulated and sent to the target when the process ends.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Target:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.select({class: 'form-control', outlet: 'targetSelect'}, () => {
                  this.option('Panel', {value: 'panel'});
                  this.option('Clipboard', {value: 'clipboard'});
                  this.option('Developer console', {value: 'console'});
                  this.option('Active editor', {value: 'editor'});
                  this.option('New file', {value: 'file'});
                  return this.option('Void', {value: 'void'});
              });
            });
          });
            this.tr(() => {
              this.td('Buffer Size:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.subview('bufferSizeEditor', new TextEditorView({mini: true}));
              });
            });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                return this.span('The maximum number of characters to keep in memory. Leave unspecified to disable the limit.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h3('Target Format', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.span('Format of output when written to the target. Any variable can be used here. The target format will not be applied if streaming is enabled.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Success:', {class: 'text-highlight top-label first-column'});
              this.td(() => {
                return this.subview('successOutputEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'successOutputInsertVariable'});
            });
          });
            this.tr(() => {
              this.td('Error:', {class: 'text-highlight top-label first-column'});
              this.td(() => {
                return this.subview('errorOutputEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'errorOutputInsertVariable'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h3('Notifications', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                this.span('Notifications can be shown at the start and end of a process. ' , {class: 'text-smaller text-subtle'});
                return this.span('A more detailed message can optionally be configured for each notification that can reference any of the defined variables.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Notify on', {class: 'th text-highlight'});
              return this.td('Detailed message (optional)', {class: 'th text-highlight'});
          });
            this.tr(() => {
              this.td({class: 'first-column'}, () => {
                this.input({type: 'checkbox', outlet: 'startNotifyCheck'});
                return this.span('Start', {class: 'check-label'});
            });
              this.td(() => {
                return this.subview('startMessageEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'startMessageInsertVariable'});
            });
          });
            this.tr(() => {
              this.td({class: 'first-column'}, () => {
                this.input({type: 'checkbox', outlet: 'successNotifyCheck'});
                return this.span('Success', {class: 'check-label'});
            });
              this.td(() => {
                return this.subview('successMessageEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'successMessageInsertVariable'});
            });
          });
            this.tr(() => {
              this.td({class: 'first-column'}, () => {
                this.input({type: 'checkbox', outlet: 'errorNotifyCheck'});
                return this.span('Error', {class: 'check-label'});
            });
              this.td(() => {
                return this.subview('errorMessageEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'errorMessageInsertVariable'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Panel', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                this.input({type: 'checkbox', outlet: 'scrollLockCheck'});
                return this.span('Auto enable scroll lock', {class: 'check-label'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                this.input({type: 'checkbox', outlet: 'autoShowCheck'});
                return this.span('Auto show when process starts', {class: 'check-label'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                this.input({type: 'checkbox', outlet: 'autoHideCheck'});
                return this.span('Auto hide when process completes', {class: 'check-label'});
            });
          });
            this.tr(() => {
              this.td('Maximum Completed:', {class: 'text-highlight first-column'});
              return this.td(() => {
                return this.subview('maxCompletedEditor', new TextEditorView({mini: true}));
              });
            });
            this.tr(() => {
              this.td(' ');
              return this.td(() => {
                return this.span('The maximum number of panels of completed processes to keep. Leave unspecified to disable the limit.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Processes', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                this.input({type: 'checkbox', outlet: 'singularCheck'});
                return this.span('Terminate running process before running a new instance', {class: 'check-label'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Patterns', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                return this.span('Choose which patterns should be applied when detecting file paths. Patterns are applied from top to bottom.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                return this.subview('patternChooseView', new PatternChooseView());
              });
            });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Environment Variables', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                this.span('Add additional environment variables. Any of the input variables can be used in the value. The environment variable itself is referenced in the command with a ', {class: 'text-smaller text-subtle'});
                this.span('$', {class: 'text-smaller text-highlight'});
                return this.span(' followed by the variable name.', {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                return this.div({class: 'bordered'}, () => {
                  return this.subview('envVarsView', new TableEditView(['Name', 'Value']));
                });
              });
            });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Input Dialogs', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                this.span('Input dialogs are used to define custom input variables.' , {class: 'text-smaller text-subtle'});
                this.span(' When running a command you will be prompted to enter a value for each.' , {class: 'text-smaller text-subtle'});
                return this.span(' These input variables can be used like any of the others.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({class: 'first-column', colspan: 2}, () => {
                return this.div({class: 'bordered'}, () => {
                  return this.subview('inputDialogsView', new TableEditView(['Name', 'Message (optional)', 'Default value (optional)']));
                });
              });
            });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Scripts', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                this.span('Custom JavaScript can be executed at the start and end of a process. ' , {class: 'text-smaller text-subtle'});
                this.span('Any of the defined variables can be accessed without needing to use braces. ' , {class: 'text-smaller text-subtle'});
                return this.span('Environment variables can be accessed with the env object, such as env[\'PWD\']. ' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('Run on', {class: 'th text-highlight'});
              return this.td('Script', {class: 'th text-highlight'});
          });
            this.tr(() => {
              this.td({class: 'first-column'}, () => {
                this.input({type: 'checkbox', outlet: 'startScriptCheck'});
                return this.span('Start', {class: 'check-label'});
            });
              this.td(() => {
                return this.subview('startScriptEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'startScriptInsertVariable'});
            });
          });
            this.tr(() => {
              this.td({class: 'first-column'}, () => {
                this.input({type: 'checkbox', outlet: 'successScriptCheck'});
                return this.span('Success', {class: 'check-label'});
            });
              this.td(() => {
                return this.subview('successScriptEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'successScriptInsertVariable'});
            });
          });
            this.tr(() => {
              this.td({class: 'first-column'}, () => {
                this.input({type: 'checkbox', outlet: 'errorScriptCheck'});
                return this.span('Error', {class: 'check-label'});
            });
              this.td(() => {
                return this.subview('errorScriptEditor', new TextEditorView());
              });
              return this.td({class: 'variable-button'}, () => {
                return this.button('Insert Variable', {class: 'btn btn-sm', click: 'errorScriptInsertVariable'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h2('Variables', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.span('Variables can be used in many of the fields. These should be surrounded with curly brackets when referenced.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                this.span('Tip!', {class: 'text-smaller inline-block highlight-info'});
                this.span('An easy way to see the value of a variable is to simply configure the shell command to echo it, like ', {class: 'text-smaller text-subtle'});
                return this.code('echo \'{configDirAbsPath}\'', {class: 'text-smaller'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h3('Input Variables', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              this.td('clipboard', {class: 'text-highlight first-column'});
              return this.td('Text currently on clipboard.');
            });
            this.tr(() => {
              this.td('fullCommand', {class: 'text-highlight first-column'});
              return this.td('The full command along with its arguments. Both the command and arguments will have their variables resolved.');
            });
            this.tr(() => {
              this.td('configDirAbsPath', {class: 'text-highlight first-column'});
              return this.td('Absolute path of folder where the process-palette.json configuration file is that defines this command.');
            });
            this.tr(() => {
              this.td('projectPath', {class: 'text-highlight first-column'});
              return this.td('If projects are open then the first project\'s folder will be used. If there aren\'t any projects open then the path of the folder containing the process-palette.json file is used.');
            });
            this.tr(() => {
              this.td('selectProjectPath', {class: 'text-highlight first-column'});
              return this.td('Prompts to choose the path of one of the projects in the workspace.');
            });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h3('Input Variables From Editor', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              this.td('fileExt', {class: 'text-highlight first-column'});
              return this.td('Extension of file.');
            });
            this.tr(() => {
              this.td('fileName', {class: 'text-highlight first-column'});
              return this.td('Name of file without extension.');
            });
            this.tr(() => {
              this.td('fileNameExt', {class: 'text-highlight first-column'});
              return this.td('Name of file with extension.');
            });
            this.tr(() => {
              this.td('filePath', {class: 'text-highlight first-column'});
              return this.td('Path of file relative to project.');
            });
            this.tr(() => {
              this.td('fileDirPath', {class: 'text-highlight first-column'});
              return this.td('Path of file\'s directory relative to project.');
            });
            this.tr(() => {
              this.td('fileAbsPath', {class: 'text-highlight first-column'});
              return this.td('Absolute path of file.');
            });
            this.tr(() => {
              this.td('fileDirAbsPath', {class: 'text-highlight first-column'});
              return this.td('Absolute path of file\'s directory.');
            });
            this.tr(() => {
              this.td('fileProjectPath', {class: 'text-highlight first-column'});
              return this.td('Absolute path of file\'s project folder.');
            });
            this.tr(() => {
              this.td('text', {class: 'text-highlight first-column'});
              return this.td('The full contents of the editor.');
            });
            this.tr(() => {
              this.td('selection', {class: 'text-highlight first-column'});
              return this.td('Currently selected text.');
            });
            this.tr(() => {
              this.td('word', {class: 'text-highlight first-column'});
              return this.td('Word under cursor.');
            });
            this.tr(() => {
              this.td('token', {class: 'text-highlight first-column'});
              return this.td('Token under cursor.');
            });
            this.tr(() => {
              this.td('line', {class: 'text-highlight first-column'});
              return this.td('Line at cursor.');
            });
            this.tr(() => {
              this.td('lineNo', {class: 'text-highlight first-column'});
              return this.td('Line number at cursor.');
            });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.h3('Output Variables', {class: 'text-highlight'});
            });
          });
            this.tr(() => {
              return this.td({colspan: 2}, () => {
                return this.span('Output variables are only available after the command has run and can therefore only be used in the target and notification formats.' , {class: 'text-smaller text-subtle'});
            });
          });
            this.tr(() => {
              this.td('stdout', {class: 'text-highlight first-column'});
              return this.td('Standard output produced by the process.');
            });
            this.tr(() => {
              this.td('stderr', {class: 'text-highlight first-column'});
              return this.td('Standard error output produced by the process.');
            });
            return this.tr(() => {
              this.td('exitStatus', {class: 'text-highlight first-column'});
              return this.td('Exit status code returned by the process.');
            });
          });
        });
      });
    });
  }

  initialize() {
    super.initialize()
    this.command = this.commandItemView.getCommand();

    // TODO
    // this.namespaceEditor.attr('tabindex', 1);
    // this.actionEditor.attr('tabindex', 2);
    // this.commandEditor.attr('tabindex', 3);
    // this.cwdEditor.attr('tabindex', 4);
    // this.keystrokeEditor.attr('tabindex', 5);
    // this.menuEditor.attr('tabindex', 6);
    // this.stdinEditor.attr('tabindex', 7);
    // this.streamCheck.attr('tabindex', 8);
    // this.targetSelect.attr('tabindex', 9);
    // this.bufferSizeEditor.attr('tabindex', 10);
    // this.successOutputEditor.attr('tabindex', 11);
    // this.errorOutputEditor.attr('tabindex', 12);
    // this.startMessageEditor.attr('tabindex', 13);
    // this.successMessageEditor.attr('tabindex', 14);
    // this.errorMessageEditor.attr('tabindex', 15);
    // this.scrollLockCheck.attr('tabindex', 16);
    // this.autoShowCheck.attr('tabindex', 17);
    // this.autoHideCheck.attr('tabindex', 18);

    // this.bufferSizeEditor.getModel().setPlaceholderText('Unspecified');
    // this.maxCompletedEditor.getModel().setPlaceholderText('Unspecified');

    // this.commandEditor.addClass('multi-line-editor');
    // this.commandEditor.getModel().setSoftTabs(true);
    // this.commandEditor.getModel().setSoftWrapped(true);
    // this.commandEditor.getModel().setLineNumberGutterVisible(false);
    // this.successOutputEditor.addClass('multi-line-editor');
    // this.successOutputEditor.getModel().setSoftTabs(true);
    // this.successOutputEditor.getModel().setLineNumberGutterVisible(false);
    // this.errorOutputEditor.addClass('multi-line-editor');
    // this.errorOutputEditor.getModel().setSoftTabs(true);
    // this.errorOutputEditor.getModel().setLineNumberGutterVisible(false);
    // this.startMessageEditor.addClass('multi-line-editor');
    // this.startMessageEditor.getModel().setSoftTabs(true);
    // this.startMessageEditor.getModel().setLineNumberGutterVisible(false);
    // this.successMessageEditor.addClass('multi-line-editor');
    // this.successMessageEditor.getModel().setSoftTabs(true);
    // this.successMessageEditor.getModel().setLineNumberGutterVisible(false);
    // this.errorMessageEditor.addClass('multi-line-editor');
    // this.errorMessageEditor.getModel().setSoftTabs(true);
    // this.errorMessageEditor.getModel().setLineNumberGutterVisible(false);
    // this.startScriptEditor.addClass('multi-line-editor');
    // this.startScriptEditor.getModel().setSoftTabs(true);
    // this.startScriptEditor.getModel().setLineNumberGutterVisible(false);
    // this.successScriptEditor.addClass('multi-line-editor');
    // this.successScriptEditor.getModel().setSoftTabs(true);
    // this.successScriptEditor.getModel().setLineNumberGutterVisible(false);
    // this.errorScriptEditor.addClass('multi-line-editor');
    // this.errorScriptEditor.getModel().setSoftTabs(true);
    // this.errorScriptEditor.getModel().setLineNumberGutterVisible(false);

    // this.stdinEditor.addClass('multi-line-editor');
    // this.stdinEditor.getModel().setSoftTabs(true);
    // this.stdinEditor.getModel().setSoftWrapped(true);
    // this.stdinEditor.getModel().setLineNumberGutterVisible(false);

    // this.showConfig();

    // this.namespaceEditor.getModel().onDidChange(this.nameChanged);
    // this.actionEditor.getModel().onDidChange(this.nameChanged);
  }

  nameChanged() {
    this.command.namespace = this.namespaceEditor.getModel().getText().trim();
    this.command.action = this.actionEditor.getModel().getText().trim();
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
    this.envVarsView.reset();
    this.inputDialogsView.reset();

    this.namespaceEditor.getModel().setText(this.command.namespace);
    this.actionEditor.getModel().setText(this.command.action);
    this.commandEditor.getModel().setText(this.appendArguments(this.command.command, this.command.arguments));
    this.cwdEditor.getModel().setText(this.emptyString(this.command.cwd));
    this.keystrokeEditor.getModel().setText(this.emptyString(this.command.keystroke));
    this.menuEditor.getModel().setText(this.command.menus.join());
    this.bufferSizeEditor.getModel().setText(this.emptyString(this.command.outputBufferSize));
    this.stdinEditor.getModel().setText(this.emptyString(this.command.input));
    this.setChecked(this.promptToSaveCheck, this.command.promptToSave);
    this.saveSelect.val(this.command.saveOption);
    this.setChecked(this.streamCheck, this.command.stream);
    this.targetSelect.val(this.command.outputTarget);
    this.setChecked(this.singularCheck, this.command.singular);
    this.setChecked(this.scrollLockCheck, this.command.scrollLockEnabled);
    this.setChecked(this.autoShowCheck, this.command.autoShowOutput);
    this.setChecked(this.autoHideCheck, this.command.autoHideOutput);
    this.maxCompletedEditor.getModel().setText(this.emptyString(this.command.maxCompleted));
    this.setMultiLineEditorText(this.successOutputEditor, this.emptyString(this.command.successOutput));
    this.setMultiLineEditorText(this.errorOutputEditor, this.emptyString(this.command.errorOutput));
    this.setChecked(this.startNotifyCheck, this.command.notifyOnStart);
    this.setChecked(this.successNotifyCheck, this.command.notifyOnSuccess);
    this.setChecked(this.errorNotifyCheck, this.command.notifyOnError);
    this.setMultiLineEditorText(this.startMessageEditor, this.emptyString(this.command.startMessage));
    this.setMultiLineEditorText(this.successMessageEditor, this.emptyString(this.command.successMessage));
    this.setMultiLineEditorText(this.errorMessageEditor, this.emptyString(this.command.errorMessage));

    this.setChecked(this.startScriptCheck, this.command.scriptOnStart);
    this.setChecked(this.successScriptCheck, this.command.scriptOnSuccess);
    this.setChecked(this.errorScriptCheck, this.command.scriptOnError);
    this.setMultiLineEditorText(this.startScriptEditor, this.emptyString(this.decode(this.command.startScript)));
    this.setMultiLineEditorText(this.successScriptEditor, this.emptyString(this.decode(this.command.successScript)));
    this.setMultiLineEditorText(this.errorScriptEditor, this.emptyString(this.decode(this.command.errorScript)));

    this.patternChooseView.setPatterns(this.config.patterns, this.command.patterns);

    if (this.command.env != null) {
      for (let name in this.command.env) {
        const value = this.command.env[name];
        this.envVarsView.addRow([name, value]);
      }
    }

    if (this.command.inputDialogs != null) {
      return Array.from(this.command.inputDialogs).map((inputDialog) =>
        this.inputDialogsView.addRow([inputDialog.variableName, inputDialog.message, inputDialog.initialInput]));
    }
  }

  encode(value) {
    if ((value == null)) {
      return value;
    }

    return btoa(value);
  }

  decode(value) {
    if ((value == null)) {
      return value;
    }

    return atob(value);
  }

  emptyString(value) {
    if ((value == null)) {
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
    if ((checked == null)) {
      checked = false;
    }

    if (checked !== this.isChecked(checkBox)) {
      return checkBox.trigger("click");
    }
  }

  isChecked(checkBox) {
    return checkBox.is(":checked");
  }

  setMultiLineEditorText(editor, text) {
    text = text.replace('\\n', '\n');
    return editor.getModel().setText(text);
  }

  insertVariable(ref, showOutputVariables = false, addBraces = true) {
    new InsertVariableView(this.refs[ref], showOutputVariables, addBraces)
  }

  commandInsertVariable() {
    return new InsertVariableView(this.commandEditor);
  }

  cwdInsertVariable() {
    return new InsertVariableView(this.refs.cwdEditor);
  }

  successOutputInsertVariable() {
    return new InsertVariableView(this.successOutputEditor, true);
  }

  errorOutputInsertVariable() {
    return new InsertVariableView(this.errorOutputEditor, true);
  }

  startMessageInsertVariable() {
    return new InsertVariableView(this.startMessageEditor, false);
  }

  successMessageInsertVariable() {
    return new InsertVariableView(this.successMessageEditor, true);
  }

  errorMessageInsertVariable() {
    return new InsertVariableView(this.errorMessageEditor, true);
  }

  startScriptInsertVariable() {
    return new InsertVariableView(this.startScriptEditor, false, false);
  }

  successScriptInsertVariable() {
    return new InsertVariableView(this.successScriptEditor, true, false);
  }

  errorScriptInsertVariable() {
    return new InsertVariableView(this.errorScriptEditor, true, false);
  }

  stdinInsertVariable() {
    return new InsertVariableView(this.stdinEditor);
  }

  persistChanges() {
    // this.command.command = this.commandEditor.getModel().getText().trim();
    // this.command.arguments = [];
    // this.command.promptToSave = this.isChecked(this.promptToSaveCheck);
    // this.command.saveOption = this.saveSelect.val();
    // this.command.stream = this.isChecked(this.streamCheck);
    // this.command.singular = this.isChecked(this.singularCheck);
    // this.command.autoShowOutput = this.isChecked(this.autoShowCheck);
    // this.command.autoHideOutput = this.isChecked(this.autoHideCheck);
    // this.command.scrollLockEnabled = this.isChecked(this.scrollLockCheck);
    // this.command.patterns = this.patternChooseView.getSelectedPatterns();
    // this.command.outputTarget = this.targetSelect.val();
    // this.command.notifyOnStart = this.isChecked(this.startNotifyCheck);
    // this.command.notifyOnSuccess = this.isChecked(this.successNotifyCheck);
    // this.command.notifyOnError = this.isChecked(this.errorNotifyCheck);
    // this.command.scriptOnStart = this.isChecked(this.startScriptCheck);
    // this.command.scriptOnSuccess = this.isChecked(this.successScriptCheck);
    // this.command.scriptOnError = this.isChecked(this.errorScriptCheck);
    // this.persistStringNullIfEmpty('cwd', this.cwdEditor.getModel().getText());
    // this.persistStringNullIfEmpty('keystroke', this.keystrokeEditor.getModel().getText());
    // this.persistStringNullIfEmpty('input', this.stdinEditor.getModel().getText());
    // this.persistStringNullIfEmpty('successOutput', this.successOutputEditor.getModel().getText());
    // this.persistStringNullIfEmpty('errorOutput', this.errorOutputEditor.getModel().getText());
    // this.persistStringNullIfEmpty('startMessage', this.startMessageEditor.getModel().getText());
    // this.persistStringNullIfEmpty('successMessage', this.successMessageEditor.getModel().getText());
    // this.persistStringNullIfEmpty('errorMessage', this.errorMessageEditor.getModel().getText());
    // this.persistStringNullIfEmpty('startScript', this.encode(this.startScriptEditor.getModel().getText()));
    // this.persistStringNullIfEmpty('successScript', this.encode(this.successScriptEditor.getModel().getText()));
    // this.persistStringNullIfEmpty('errorScript', this.encode(this.errorScriptEditor.getModel().getText()));

    // this.persistIntegerNullIfNaN('outputBufferSize', this.bufferSizeEditor.getModel().getText());
    // this.persistIntegerNullIfNaN('maxCompleted', this.maxCompletedEditor.getModel().getText());
    // this.persistEnv();
    // this.persistMenus();
    // this.persistInputDialogs();
  }

  persistStringNullIfEmpty(name, value) {
    if (value.trim().length === 0) {
      this.command[name] = null;
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
    let menus = this.menuEditor.getModel().getText().trim();

    if (menus.length === 0) {
      menus = [];
    } else {
      menus = menus.split(',');
    }

    this.command.menus = [];
    return (() => {
      const result = [];
      for (let menu of Array.from(menus)) {
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
    const rows = this.inputDialogsView.getRows();

    for (let row of Array.from(rows)) {
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
    const rows = this.envVarsView.getRows();

    for (let row of Array.from(rows)) {
      const name = row[0].trim();

      if (name.length > 0) {
        env[name] = row[1];
      }
    }

    this.command.env = env;
  }
}
