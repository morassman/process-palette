{CompositeDisposable} = require 'atom'
{View, TextEditorView} = require 'atom-space-pen-views'
TableEditView = require './table-edit-view'
PatternChooseView = require './pattern-choose-view'
InsertVariableView = require './insert-variable-view'
_ = require 'underscore-plus'

module.exports =
class CommandEditView extends View

  constructor: (@config, @commandItemView) ->
    super();

  @content: ->
    @div =>
      @div {class:'command-edit-view'}, =>
        @table =>
          @tbody =>
            @tr =>
              @td {colspan: 2}, =>
                @h2 'General', {class: 'text-highlight'}
            @tr =>
              @td 'Namespace:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'namespaceEditor', new TextEditorView(mini: true)
            @tr =>
              @td 'Action Name:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'actionEditor', new TextEditorView(mini: true)
            @tr =>
              @td ' '
              @td =>
                @span 'The namespace and action name together forms the identifier in the command palette. These should be lowercase and words separated by hyphens.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Shell Command:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'commandEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'commandInsertVariable'}
            @tr =>
              @td ' '
              @td =>
                @span 'Command with arguments to run. Any of the input variables can be used.', {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Working Directory:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'cwdEditor', new TextEditorView(mini: true)
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'cwdInsertVariable'}
            @tr =>
              @td ' '
              @td =>
                @span 'Working directory when running command. Any of the input variables can be used.', {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Keystroke:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'keystrokeEditor', new TextEditorView(mini: true)
            @tr =>
              @td ' '
              @td =>
                @span 'Shortcut key. Combine shift, ctrl, cmd and alt with other keys, like ', {class: 'text-smaller text-subtle'}
                @span 'ctrl-alt-r', {class: 'text-smaller text-highlight'}
            @tr =>
              @td 'Menu:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'menuEditor', new TextEditorView(mini: true)
            @tr =>
              @td ' '
              @td =>
                @span 'A comma separated list of menu names like ', {class: 'text-smaller text-subtle'}
                @span 'Processes, Global', {class: 'text-smaller text-highlight'}
                @span '. The first name is the top level menu in Atom, followed by sub menus. Menus are created as needed and the action name is then placed in the last menu.', {class: 'text-smaller text-subtle'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Saving', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2, class: 'text-smaller text-subtle'}, =>
                @span 'It may be necessary to first save edited files before running a command. '
                @span 'If that is the case then either all files can be saved or only those that are references by the command.'
            @tr =>
              @td 'Save:', {class: 'text-highlight first-column'}
              @td =>
                @select {class: 'form-control', outlet: 'saveSelect'}, =>
                  @option 'None', {value: 'none'}
                  @option 'All', {value: 'all'}
                  @option 'Referenced', {value: 'referenced'}
            @tr =>
              @td ' '
              @td =>
                @span 'Specify what needs to be saved before the command is executed.', {class: 'text-smaller text-subtle'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'promptToSaveCheck'}
                @span 'Prompt before saving', {class: 'check-label'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Input', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2, class: 'text-smaller text-subtle'}, =>
                @span 'This text is sent to the process\'s standard input on execution.'
            @tr =>
              @td 'Input', {class: 'text-highlight first-column'}
              @td =>
                @subview 'stdinEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'stdinInsertVariable'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Output', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'streamCheck'}
                @span 'Stream output to target', {class: 'check-label'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @span 'Select to stream output to target as it is produced. If not selected then the output will be accumulated and sent to the target when the process ends.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Target:', {class: 'text-highlight first-column'}
              @td =>
                @select {class: 'form-control', outlet: 'targetSelect'}, =>
                  @option 'Panel', {value: 'panel'}
                  @option 'Clipboard', {value: 'clipboard'}
                  @option 'Developer console', {value: 'console'}
                  @option 'Active editor', {value: 'editor'}
                  @option 'New file', {value: 'file'}
                  @option 'Void', {value: 'void'}
            @tr =>
              @td 'Buffer Size:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'bufferSizeEditor', new TextEditorView(mini: true)
            @tr =>
              @td ' '
              @td =>
                @span 'The maximum number of characters to keep in memory. Leave unspecified to disable the limit.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td {colspan: 2}, =>
                @h3 'Target Format', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Format of output when written to the target. Any variable can be used here. The target format will not be applied if streaming is enabled.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Success:', {class: 'text-highlight top-label first-column'}
              @td =>
                @subview 'successOutputEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'successOutputInsertVariable'}
            @tr =>
              @td 'Error:', {class: 'text-highlight top-label first-column'}
              @td =>
                @subview 'errorOutputEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'errorOutputInsertVariable'}
            @tr =>
              @td {colspan: 2}, =>
                @h3 'Notifications', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Notifications can be shown at the start and end of a process. ' , {class: 'text-smaller text-subtle'}
                @span 'A more detailed message can optionally be configured for each notification that can reference any of the defined variables.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Notify on', {class: 'th text-highlight'}
              @td 'Detailed message (optional)', {class: 'th text-highlight'}
            @tr =>
              @td {class: 'first-column'}, =>
                @input {type: 'checkbox', outlet: 'startNotifyCheck'}
                @span 'Start', {class: 'check-label'}
              @td =>
                @subview 'startMessageEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'startMessageInsertVariable'}
            @tr =>
              @td {class: 'first-column'}, =>
                @input {type: 'checkbox', outlet: 'successNotifyCheck'}
                @span 'Success', {class: 'check-label'}
              @td =>
                @subview 'successMessageEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'successMessageInsertVariable'}
            @tr =>
              @td {class: 'first-column'}, =>
                @input {type: 'checkbox', outlet: 'errorNotifyCheck'}
                @span 'Error', {class: 'check-label'}
              @td =>
                @subview 'errorMessageEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'errorMessageInsertVariable'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Panel', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'scrollLockCheck'}
                @span 'Auto enable scroll lock', {class: 'check-label'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'autoShowCheck'}
                @span 'Auto show when process starts', {class: 'check-label'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'autoHideCheck'}
                @span 'Auto hide when process completes', {class: 'check-label'}
            @tr =>
              @td 'Maximum Completed:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'maxCompletedEditor', new TextEditorView(mini: true)
            @tr =>
              @td ' '
              @td =>
                @span 'The maximum number of panels of completed processes to keep. Leave unspecified to disable the limit.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Processes', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'singularCheck'}
                @span 'Terminate running process before running a new instance', {class: 'check-label'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Patterns', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @span 'Choose which patterns should be applied when detecting file paths. Patterns are applied from top to bottom.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @subview 'patternChooseView', new PatternChooseView()
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Environment Variables', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Add additional environment variables. Any of the input variables can be used in the value. The environment variable itself is referenced in the command with a ', {class: 'text-smaller text-subtle'}
                @span '$', {class: 'text-smaller text-highlight'}
                @span ' followed by the variable name.', {class: 'text-smaller text-subtle'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @div {class: 'bordered'}, =>
                  @subview 'envVarsView', new TableEditView(['Name', 'Value'])
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Input Dialogs', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Input dialogs are used to define custom input variables.' , {class: 'text-smaller text-subtle'}
                @span ' When running a command you will be prompted to enter a value for each.' , {class: 'text-smaller text-subtle'}
                @span ' These input variables can be used like any of the others.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @div {class: 'bordered'}, =>
                  @subview 'inputDialogsView', new TableEditView(['Name', 'Message (optional)', 'Default value (optional)'])
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Scripts', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Custom JavaScript can be executed at the start and end of a process. ' , {class: 'text-smaller text-subtle'}
                @span 'Any of the defined variables can be accessed without needing to use braces. ' , {class: 'text-smaller text-subtle'}
                @span 'Environment variables can be accessed with the env object, such as env[\'PWD\']. ' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'Run on', {class: 'th text-highlight'}
              @td 'Script', {class: 'th text-highlight'}
            @tr =>
              @td {class: 'first-column'}, =>
                @input {type: 'checkbox', outlet: 'startScriptCheck'}
                @span 'Start', {class: 'check-label'}
              @td =>
                @subview 'startScriptEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'startScriptInsertVariable'}
            @tr =>
              @td {class: 'first-column'}, =>
                @input {type: 'checkbox', outlet: 'successScriptCheck'}
                @span 'Success', {class: 'check-label'}
              @td =>
                @subview 'successScriptEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'successScriptInsertVariable'}
            @tr =>
              @td {class: 'first-column'}, =>
                @input {type: 'checkbox', outlet: 'errorScriptCheck'}
                @span 'Error', {class: 'check-label'}
              @td =>
                @subview 'errorScriptEditor', new TextEditorView()
              @td {class: 'variable-button'}, =>
                @button 'Insert Variable', {class: 'btn btn-sm', click: 'errorScriptInsertVariable'}
            @tr =>
              @td {colspan: 2}, =>
                @h2 'Variables', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Variables can be used in many of the fields. These should be surrounded with curly brackets when referenced.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Tip!', {class: 'text-smaller inline-block highlight-info'}
                @span 'An easy way to see the value of a variable is to simply configure the shell command to echo it, like ', {class: 'text-smaller text-subtle'}
                @code 'echo \'{configDirAbsPath}\'', {class: 'text-smaller'}
            @tr =>
              @td {colspan: 2}, =>
                @h3 'Input Variables', {class: 'text-highlight'}
            @tr =>
              @td 'clipboard', {class: 'text-highlight first-column'}
              @td 'Text currently on clipboard.'
            @tr =>
              @td 'fullCommand', {class: 'text-highlight first-column'}
              @td 'The full command along with its arguments. Both the command and arguments will have their variables resolved.'
            @tr =>
              @td 'configDirAbsPath', {class: 'text-highlight first-column'}
              @td 'Absolute path of folder where the process-palette.json configuration file is that defines this command.'
            @tr =>
              @td 'projectPath', {class: 'text-highlight first-column'}
              @td 'If projects are open then the first project\'s folder will be used. If there aren\'t any projects open then the path of the folder containing the process-palette.json file is used.'
            @tr =>
              @td 'selectProjectPath', {class: 'text-highlight first-column'}
              @td 'Prompts to choose the path of one of the projects in the workspace.'
            @tr =>
              @td {colspan: 2}, =>
                @h3 'Input Variables From Editor', {class: 'text-highlight'}
            @tr =>
              @td 'fileExt', {class: 'text-highlight first-column'}
              @td 'Extension of file.'
            @tr =>
              @td 'fileName', {class: 'text-highlight first-column'}
              @td 'Name of file without extension.'
            @tr =>
              @td 'fileNameExt', {class: 'text-highlight first-column'}
              @td 'Name of file with extension.'
            @tr =>
              @td 'filePath', {class: 'text-highlight first-column'}
              @td 'Path of file relative to project.'
            @tr =>
              @td 'fileDirPath', {class: 'text-highlight first-column'}
              @td 'Path of file\'s directory relative to project.'
            @tr =>
              @td 'fileAbsPath', {class: 'text-highlight first-column'}
              @td 'Absolute path of file.'
            @tr =>
              @td 'fileDirAbsPath', {class: 'text-highlight first-column'}
              @td 'Absolute path of file\'s directory.'
            @tr =>
              @td 'fileProjectPath', {class: 'text-highlight first-column'}
              @td 'Absolute path of file\'s project folder.'
            @tr =>
              @td 'text', {class: 'text-highlight first-column'}
              @td 'The full contents of the editor.'
            @tr =>
              @td 'selection', {class: 'text-highlight first-column'}
              @td 'Currently selected text.'
            @tr =>
              @td 'word', {class: 'text-highlight first-column'}
              @td 'Word under cursor.'
            @tr =>
              @td 'token', {class: 'text-highlight first-column'}
              @td 'Token under cursor.'
            @tr =>
              @td 'line', {class: 'text-highlight first-column'}
              @td 'Line at cursor.'
            @tr =>
              @td 'lineNo', {class: 'text-highlight first-column'}
              @td 'Line number at cursor.'
            @tr =>
              @td {colspan: 2}, =>
                @h3 'Output Variables', {class: 'text-highlight'}
            @tr =>
              @td {colspan: 2}, =>
                @span 'Output variables are only available after the command has run and can therefore only be used in the target and notification formats.' , {class: 'text-smaller text-subtle'}
            @tr =>
              @td 'stdout', {class: 'text-highlight first-column'}
              @td 'Standard output produced by the process.'
            @tr =>
              @td 'stderr', {class: 'text-highlight first-column'}
              @td 'Standard error output produced by the process.'
            @tr =>
              @td 'exitStatus', {class: 'text-highlight first-column'}
              @td 'Exit status code returned by the process.'

  initialize: ->
    @command = @commandItemView.getCommand();

    @namespaceEditor.attr('tabindex', 1);
    @actionEditor.attr('tabindex', 2);
    @commandEditor.attr('tabindex', 3);
    @cwdEditor.attr('tabindex', 4);
    @keystrokeEditor.attr('tabindex', 5);
    @menuEditor.attr('tabindex', 6);
    @stdinEditor.attr('tabindex', 7);
    @streamCheck.attr('tabindex', 8);
    @targetSelect.attr('tabindex', 9);
    @bufferSizeEditor.attr('tabindex', 10);
    @successOutputEditor.attr('tabindex', 11);
    @errorOutputEditor.attr('tabindex', 12);
    @startMessageEditor.attr('tabindex', 13);
    @successMessageEditor.attr('tabindex', 14);
    @errorMessageEditor.attr('tabindex', 15);
    @scrollLockCheck.attr('tabindex', 16);
    @autoShowCheck.attr('tabindex', 17);
    @autoHideCheck.attr('tabindex', 18);

    @bufferSizeEditor.getModel().setPlaceholderText('Unspecified');
    @maxCompletedEditor.getModel().setPlaceholderText('Unspecified');

    @commandEditor.addClass('multi-line-editor');
    @commandEditor.getModel().setSoftTabs(true);
    @commandEditor.getModel().setSoftWrapped(true);
    @commandEditor.getModel().setLineNumberGutterVisible(false);
    @successOutputEditor.addClass('multi-line-editor');
    @successOutputEditor.getModel().setSoftTabs(true);
    @successOutputEditor.getModel().setLineNumberGutterVisible(false);
    @errorOutputEditor.addClass('multi-line-editor');
    @errorOutputEditor.getModel().setSoftTabs(true);
    @errorOutputEditor.getModel().setLineNumberGutterVisible(false);
    @startMessageEditor.addClass('multi-line-editor');
    @startMessageEditor.getModel().setSoftTabs(true);
    @startMessageEditor.getModel().setLineNumberGutterVisible(false);
    @successMessageEditor.addClass('multi-line-editor');
    @successMessageEditor.getModel().setSoftTabs(true);
    @successMessageEditor.getModel().setLineNumberGutterVisible(false);
    @errorMessageEditor.addClass('multi-line-editor');
    @errorMessageEditor.getModel().setSoftTabs(true);
    @errorMessageEditor.getModel().setLineNumberGutterVisible(false);
    @startScriptEditor.addClass('multi-line-editor');
    @startScriptEditor.getModel().setSoftTabs(true);
    @startScriptEditor.getModel().setLineNumberGutterVisible(false);
    @successScriptEditor.addClass('multi-line-editor');
    @successScriptEditor.getModel().setSoftTabs(true);
    @successScriptEditor.getModel().setLineNumberGutterVisible(false);
    @errorScriptEditor.addClass('multi-line-editor');
    @errorScriptEditor.getModel().setSoftTabs(true);
    @errorScriptEditor.getModel().setLineNumberGutterVisible(false);

    @stdinEditor.addClass('multi-line-editor');
    @stdinEditor.getModel().setSoftTabs(true);
    @stdinEditor.getModel().setSoftWrapped(true);
    @stdinEditor.getModel().setLineNumberGutterVisible(false);

    @showConfig();

    @namespaceEditor.getModel().onDidChange(@nameChanged);
    @actionEditor.getModel().onDidChange(@nameChanged);

  nameChanged: =>
    @command.namespace = @namespaceEditor.getModel().getText().trim();
    @command.action = @actionEditor.getModel().getText().trim();
    @commandItemView.refreshName();

  destroy: ->
    @element.remove();

  getElement: ->
    return @element;

  # Populates the view with the config.
  showConfig: ->
    @envVarsView.reset();
    @inputDialogsView.reset();

    @namespaceEditor.getModel().setText(@command.namespace);
    @actionEditor.getModel().setText(@command.action);
    @commandEditor.getModel().setText(@appendArguments(@command.command, @command.arguments));
    @cwdEditor.getModel().setText(@emptyString(@command.cwd));
    @keystrokeEditor.getModel().setText(@emptyString(@command.keystroke));
    @menuEditor.getModel().setText(@command.menus.join());
    @bufferSizeEditor.getModel().setText(@emptyString(@command.outputBufferSize));
    @stdinEditor.getModel().setText(@emptyString(@command.input));
    @setChecked(@promptToSaveCheck, @command.promptToSave);
    @saveSelect.val(@command.saveOption);
    @setChecked(@streamCheck, @command.stream);
    @targetSelect.val(@command.outputTarget);
    @setChecked(@singularCheck, @command.singular);
    @setChecked(@scrollLockCheck, @command.scrollLockEnabled);
    @setChecked(@autoShowCheck, @command.autoShowOutput);
    @setChecked(@autoHideCheck, @command.autoHideOutput);
    @maxCompletedEditor.getModel().setText(@emptyString(@command.maxCompleted));
    @setMultiLineEditorText(@successOutputEditor, @emptyString(@command.successOutput));
    @setMultiLineEditorText(@errorOutputEditor, @emptyString(@command.errorOutput));
    @setChecked(@startNotifyCheck, @command.notifyOnStart);
    @setChecked(@successNotifyCheck, @command.notifyOnSuccess);
    @setChecked(@errorNotifyCheck, @command.notifyOnError);
    @setMultiLineEditorText(@startMessageEditor, @emptyString(@command.startMessage));
    @setMultiLineEditorText(@successMessageEditor, @emptyString(@command.successMessage));
    @setMultiLineEditorText(@errorMessageEditor, @emptyString(@command.errorMessage));

    @setChecked(@startScriptCheck, @command.scriptOnStart);
    @setChecked(@successScriptCheck, @command.scriptOnSuccess);
    @setChecked(@errorScriptCheck, @command.scriptOnError);
    @setMultiLineEditorText(@startScriptEditor, @emptyString(@decode(@command.startScript)));
    @setMultiLineEditorText(@successScriptEditor, @emptyString(@decode(@command.successScript)));
    @setMultiLineEditorText(@errorScriptEditor, @emptyString(@decode(@command.errorScript)));

    @patternChooseView.setPatterns(@config.patterns, @command.patterns);

    if @command.env?
      for name, value of @command.env
        @envVarsView.addRow([name, value]);

    if @command.inputDialogs?
      for inputDialog in @command.inputDialogs
        @inputDialogsView.addRow([inputDialog.variableName, inputDialog.message, inputDialog.initialInput]);

  encode: (value) ->
    if !value?
      return value;

    return btoa(value);

  decode: (value) ->
    if !value?
      return value;

    return atob(value);

  emptyString: (value) ->
    if !value?
      return '';

    return value.toString();

  appendArguments: (command, args) ->
    if args.length > 0
      command += " " + args.join(" ");

    return command;

  setChecked: (checkBox, checked) ->
    if !checked?
      checked = false;

    if checked != @isChecked(checkBox)
      checkBox.trigger("click");

  isChecked: (checkBox) ->
    return checkBox.is(":checked");

  setMultiLineEditorText: (editor, text) ->
    text = text.replace('\\n', '\n');
    editor.getModel().setText(text);

  commandInsertVariable: ->
    new InsertVariableView(@commandEditor);

  cwdInsertVariable: ->
    new InsertVariableView(@cwdEditor);

  successOutputInsertVariable: ->
    new InsertVariableView(@successOutputEditor, true);

  errorOutputInsertVariable: ->
    new InsertVariableView(@errorOutputEditor, true);

  startMessageInsertVariable: ->
    new InsertVariableView(@startMessageEditor, false);

  successMessageInsertVariable: ->
    new InsertVariableView(@successMessageEditor, true);

  errorMessageInsertVariable: ->
    new InsertVariableView(@errorMessageEditor, true);

  startScriptInsertVariable: ->
    new InsertVariableView(@startScriptEditor, false, false);

  successScriptInsertVariable: ->
    new InsertVariableView(@successScriptEditor, true, false);

  errorScriptInsertVariable: ->
    new InsertVariableView(@errorScriptEditor, true, false);

  stdinInsertVariable: ->
    new InsertVariableView(@stdinEditor);

  persistChanges: ->
    @command.command = @commandEditor.getModel().getText().trim();
    @command.arguments = [];
    @command.promptToSave = @isChecked(@promptToSaveCheck);
    @command.saveOption = @saveSelect.val();
    @command.stream = @isChecked(@streamCheck);
    @command.singular = @isChecked(@singularCheck);
    @command.autoShowOutput = @isChecked(@autoShowCheck);
    @command.autoHideOutput = @isChecked(@autoHideCheck);
    @command.scrollLockEnabled = @isChecked(@scrollLockCheck);
    @command.patterns = @patternChooseView.getSelectedPatterns();
    @command.outputTarget = @targetSelect.val();
    @command.notifyOnStart = @isChecked(@startNotifyCheck);
    @command.notifyOnSuccess = @isChecked(@successNotifyCheck);
    @command.notifyOnError = @isChecked(@errorNotifyCheck);
    @command.scriptOnStart = @isChecked(@startScriptCheck);
    @command.scriptOnSuccess = @isChecked(@successScriptCheck);
    @command.scriptOnError = @isChecked(@errorScriptCheck);
    @persistStringNullIfEmpty('cwd', @cwdEditor.getModel().getText());
    @persistStringNullIfEmpty('keystroke', @keystrokeEditor.getModel().getText());
    @persistStringNullIfEmpty('input', @stdinEditor.getModel().getText());
    @persistStringNullIfEmpty('successOutput', @successOutputEditor.getModel().getText());
    @persistStringNullIfEmpty('errorOutput', @errorOutputEditor.getModel().getText());
    @persistStringNullIfEmpty('startMessage', @startMessageEditor.getModel().getText());
    @persistStringNullIfEmpty('successMessage', @successMessageEditor.getModel().getText());
    @persistStringNullIfEmpty('errorMessage', @errorMessageEditor.getModel().getText());
    @persistStringNullIfEmpty('startScript', @encode(@startScriptEditor.getModel().getText()));
    @persistStringNullIfEmpty('successScript', @encode(@successScriptEditor.getModel().getText()));
    @persistStringNullIfEmpty('errorScript', @encode(@errorScriptEditor.getModel().getText()));

    @persistIntegerNullIfNaN('outputBufferSize', @bufferSizeEditor.getModel().getText());
    @persistIntegerNullIfNaN('maxCompleted', @maxCompletedEditor.getModel().getText());
    @persistEnv();
    @persistMenus();
    @persistInputDialogs();

  persistStringNullIfEmpty: (name, value) ->
    if value.trim().length == 0
      @command[name] = null;
    else
      @command[name] = value;

  persistIntegerNullIfNaN: (name, sValue) ->
    value = Number.parseInt(sValue.trim());

    if _.isNaN(value)
      value = null;

    @command[name] = value;

  persistMenus: ->
    menus = @menuEditor.getModel().getText().trim();

    if menus.length == 0
      menus = [];
    else
      menus = menus.split(',');

    @command.menus = [];
    for menu in menus
      menu = menu.trim();
      if menu.length > 0
        @command.menus.push(menu);

  persistInputDialogs: ->
    inputDialogs = [];
    rows = @inputDialogsView.getRows();

    for row in rows
      inputDialog = {};
      inputDialog.variableName = row[0].trim();

      if inputDialog.variableName.length > 0
        inputDialog.message = row[1].trim();
        inputDialog.initialInput = row[2].trim();
        inputDialogs.push(inputDialog);

    @command.inputDialogs = inputDialogs;

  persistEnv: ->
    env = {};
    rows = @envVarsView.getRows();

    for row in rows
      name = row[0].trim();

      if name.length > 0
        env[name] = row[1];

    @command.env = env;
