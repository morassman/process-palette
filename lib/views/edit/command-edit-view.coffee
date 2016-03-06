{CompositeDisposable} = require 'atom'
{View, TextEditorView} = require 'atom-space-pen-views'
PatternChooseView = require './pattern-choose-view'
TableEditView = require './table-edit-view'
_ = require 'underscore-plus'

module.exports =
class CommandEditView extends View

  constructor: (@config, @commandItemView) ->
    super();

  @content: ->
    @div =>
      @div {class:'process-palette-command-edit-view'}, =>
        @table =>
          @tbody =>
            @tr =>
              @td =>
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
              @td 'Shell Command:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'commandEditor', new TextEditorView(mini: true)
            @tr =>
              @td 'Working Directory:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'cwdEditor', new TextEditorView(mini: true)
            @tr =>
              @td 'Keystroke:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'keystrokeEditor', new TextEditorView(mini: true)
            @tr =>
              @td =>
                @h2 'Output', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @input {type: 'checkbox', outlet: 'streamCheck'}
                @span 'Stream output to target', {class: 'check-label'}
            @tr =>
              @td 'Target:', {class: 'text-highlight first-column'}
              @td =>
                @select {class: 'form-control', outlet: 'targetSelect'}, =>
                  @option 'Panel', {value: 'panel'}
                  @option 'Clipboard', {value: 'clipboard'}
                  @option 'Developer console', {value: 'console'}
                  @option 'Editor', {value: 'editor'}
                  @option 'New file', {value: 'file'}
                  @option 'Void', {value: 'void'}
            @tr =>
              @td 'Buffer Size:', {class: 'text-highlight first-column'}
              @td =>
                @subview 'bufferSizeEditor', new TextEditorView(mini: true)
            @tr =>
              @td =>
                @h3 'Target Format', {class: 'text-highlight'}
            @tr =>
              @td 'Success:', {class: 'text-highlight top-label first-column'}
              @td =>
                @subview 'successOutputEditor', new TextEditorView()
            @tr =>
              @td 'Error:', {class: 'text-highlight top-label first-column'}
              @td =>
                @subview 'errorOutputEditor', new TextEditorView()
            @tr =>
              @td =>
                @h3 'Notification Format', {class: 'text-highlight'}
            @tr =>
              @td 'Success:', {class: 'text-highlight top-label first-column'}
              @td =>
                @subview 'successMessageEditor', new TextEditorView()
            @tr =>
              @td 'Error:', {class: 'text-highlight top-label first-column'}
              @td =>
                @subview 'errorMessageEditor', new TextEditorView()
            @tr =>
              @td =>
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
              @td =>
                @h2 'Patterns', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @subview 'patternChooseView', new PatternChooseView()
            @tr =>
              @td =>
                @h2 'Environment Variables', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @div {class: 'bordered'}, =>
                  @subview 'envVarsView', new TableEditView(['Name', 'Value'])
            @tr =>
              @td =>
                @h2 'Input Dialogs', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @div {class: 'bordered'}, =>
                  @subview 'inputDialogsView', new TableEditView(['Name', 'Message', 'Default value'])

  initialize: ->
    @command = @commandItemView.getCommand();

    @namespaceEditor.attr('tabindex', 1);
    @actionEditor.attr('tabindex', 2);
    @commandEditor.attr('tabindex', 3);
    @cwdEditor.attr('tabindex', 4);
    @keystrokeEditor.attr('tabindex', 5);
    @streamCheck.attr('tabindex', 6);
    @targetSelect.attr('tabindex', 7);
    @bufferSizeEditor.attr('tabindex', 8);
    @successOutputEditor.attr('tabindex', 9);
    @errorOutputEditor.attr('tabindex', 10);
    @successMessageEditor.attr('tabindex', 11);
    @errorMessageEditor.attr('tabindex', 12);
    @scrollLockCheck.attr('tabindex', 13);
    @autoShowCheck.attr('tabindex', 14);
    @autoHideCheck.attr('tabindex', 15);

    @bufferSizeEditor.getModel().setPlaceholderText('Unspecified');
    @maxCompletedEditor.getModel().setPlaceholderText('Unspecified');

    @successOutputEditor.addClass('multi-line-editor');
    @successOutputEditor.getModel().setSoftTabs(true);
    @successOutputEditor.getModel().setLineNumberGutterVisible(false);
    @errorOutputEditor.addClass('multi-line-editor');
    @errorOutputEditor.getModel().setSoftTabs(true);
    @errorOutputEditor.getModel().setLineNumberGutterVisible(false);
    @successMessageEditor.addClass('multi-line-editor');
    @successMessageEditor.getModel().setSoftTabs(true);
    @successMessageEditor.getModel().setLineNumberGutterVisible(false);
    @errorMessageEditor.addClass('multi-line-editor');
    @errorMessageEditor.getModel().setSoftTabs(true);
    @errorMessageEditor.getModel().setLineNumberGutterVisible(false);

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
    @bufferSizeEditor.getModel().setText(@emptyString(@command.outputBufferSize));
    @setChecked(@streamCheck, @command.stream);
    @targetSelect.val(@command.outputTarget);
    @setChecked(@scrollLockCheck, @command.scrollLockEnabled);
    @setChecked(@autoShowCheck, @command.autoShowOutput);
    @setChecked(@autoHideCheck, @command.autoHideOutput);
    @maxCompletedEditor.getModel().setText(@emptyString(@command.maxCompleted));
    @setMultiLineEditorText(@successOutputEditor, @emptyString(@command.successOutput));
    @setMultiLineEditorText(@errorOutputEditor, @emptyString(@command.errorOutput));
    @setMultiLineEditorText(@successMessageEditor, @emptyString(@command.successMessage));
    @setMultiLineEditorText(@errorMessageEditor, @emptyString(@command.errorMessage));
    @patternChooseView.setPatterns(@config.patterns, @command.patterns);

    if @command.env?
      for name, value of @command.env
        @envVarsView.addRow([name, value]);

    if @command.inputDialogs?
      for inputDialog in @command.inputDialogs
        @inputDialogsView.addRow([inputDialog.variableName, inputDialog.message, inputDialog.initialInput]);

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

  persistChanges: ->
    console.log("persistChanges");

    @command.command = @commandEditor.getModel().getText().trim();
    @command.arguments = [];
    @command.stream = @isChecked(@streamCheck);
    @command.autoShowOutput = @isChecked(@autoShowCheck);
    @command.autoHideOutput = @isChecked(@autoHideCheck);
    @command.scrollLockEnabled = @isChecked(@scrollLockCheck);
    @command.patterns = @patternChooseView.getSelectedPatterns();
    @command.outputTarget = @targetSelect.val();
    @persistStringNullIfEmpty('cwd', @cwdEditor.getModel().getText());
    @persistStringNullIfEmpty('keystroke', @keystrokeEditor.getModel().getText());
    @persistStringNullIfEmpty('successOutput', @successOutputEditor.getModel().getText());
    @persistStringNullIfEmpty('errorOutput', @errorOutputEditor.getModel().getText());
    @persistStringNullIfEmpty('successMessage', @successMessageEditor.getModel().getText());
    @persistStringNullIfEmpty('errorMessage', @errorMessageEditor.getModel().getText());
    @persistIntegerNullIfNaN('outputBufferSize', @bufferSizeEditor.getModel().getText());
    @persistIntegerNullIfNaN('maxCompleted', @maxCompletedEditor.getModel().getText());
    @persistEnv();
    @persistInputDialogs();

    console.log(@command);

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
