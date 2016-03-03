{CompositeDisposable} = require 'atom'
{View, TextEditorView} = require 'atom-space-pen-views'
PatternChooseView = require './pattern-choose-view'
TableEditView = require './table-edit-view'

module.exports =
class CommandEditView extends View

  constructor: (@config, @commandIndex) ->
    super(@config);

  @content: (config) ->
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
                @h3 'Message Format', {class: 'text-highlight'}
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
                @subview 'patternChooseView', new PatternChooseView(config.patterns)
            @tr =>
              @td =>
                @h2 'Environment Variables', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @subview 'envVarsView', new TableEditView(['Name', 'Value'])
            @tr =>
              @td =>
                @h2 'Input Dialogs', {class: 'text-highlight'}
            @tr =>
              @td {class: 'first-column', colspan: 2}, =>
                @subview 'inputDialogsView', new TableEditView(['Name', 'Message', 'Default value'])

  getTitle: ->
    return 'CommandEditView';

  serialize: ->

  initialize: ->
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

  destroy: ->
    @element.remove();

  getElement: ->
    return @element;

  # Populates the view with the config.
  showConfig: ->
    command = @config.commands[@commandIndex];

    @namespaceEditor.getModel().setText(command.namespace);
    @actionEditor.getModel().setText(command.action);
    @commandEditor.getModel().setText(command.command);
    @cwdEditor.getModel().setText(command.cwd);
    @keystrokeEditor.getModel().setText(command.keystroke);
    @bufferSizeEditor.getModel().setText(command.outputBufferSize.toString());
    @setChecked(@streamCheck, command.stream);
    @targetSelect.val(command.outputTarget);
    @setChecked(@scrollLockCheck, command.scrollLockEnabled);
    @setChecked(@autoShowCheck, command.autoShowOutput);
    @setChecked(@autoHideCheck, command.autoHideOutput);
    @maxCompletedEditor.getModel().setText(command.maxCompleted.toString());
    @setMultiLineEditorText(@successOutputEditor, command.successOutput);
    @setMultiLineEditorText(@errorOutputEditor, command.errorOutput);
    @setMultiLineEditorText(@successMessageEditor, command.successMessage);
    @setMultiLineEditorText(@errorMessageEditor, command.errorMessage);
    @patternChooseView.selectPatterns(command.patterns);

    if command.env?
      for name, value of command.env
        @envVarsView.addRow([name, value]);

    if command.inputDialogs?
      for inputDialog in command.inputDialogs
        @inputDialogsView.addRow([inputDialog.variableName, inputDialog.message, inputDialog.initialInput]);

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
