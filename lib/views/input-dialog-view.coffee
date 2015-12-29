{$, TextEditorView, View}  = require 'atom-space-pen-views'

module.exports =
class InputDialogView extends View

  @content: (message, initialInput, confirmFunc) ->
    @div class: 'input-dialog', =>
      @div class: 'message', message
      @subview 'miniEditor', new TextEditorView(mini: true)

  initialize: (message, initialInput, confirmFunc) ->
    @confirmFunc = confirmFunc
    @panel = atom.workspace.addModalPanel(item: this, visible: false)

    @miniEditor.on 'blur', => @close()
    atom.commands.add @miniEditor.element, 'core:confirm', => @confirm()
    atom.commands.add @miniEditor.element, 'core:cancel', => @close()

    @miniEditor.getModel().setText initialInput

    @storeFocusedElement()
    @panel.show()
    @miniEditor.focus()

  close: ->
    return unless @panel.isVisible()

    miniEditorFocused = @miniEditor.hasFocus()
    @miniEditor.setText('')
    @panel.hide()
    @restoreFocus() if miniEditorFocused

  confirm: ->
    inputText = @miniEditor.getText()
    @confirmFunc inputText
    editor = atom.workspace.getActiveTextEditor()
    @close()

  storeFocusedElement: ->
    @previouslyFocusedElement = $(':focus')

  restoreFocus: ->
    if @previouslyFocusedElement?.isOnDom()
      @previouslyFocusedElement.focus()
    else
      atom.views.getView(atom.workspace).focus()
