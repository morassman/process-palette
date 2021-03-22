/** @babel */
const {$, TextEditorView, View}  = require('atom-space-pen-views');

export default class InputDialogView extends View {

  static content(message, initialInput, confirmFunc) {
    return this.div({class: 'input-dialog'}, () => {
      this.div({class: 'message'}, message);
      return this.subview('miniEditor', new TextEditorView({mini: true}));
    });
  }

  initialize(message, initialInput, confirmFunc) {
    this.confirmFunc = confirmFunc;
    this.panel = atom.workspace.addModalPanel({item: this, visible: false});

    this.miniEditor.on('blur', () => this.close());
    atom.commands.add(this.miniEditor.element, 'core:confirm', () => this.confirm());
    atom.commands.add(this.miniEditor.element, 'core:cancel', () => this.close());

    this.miniEditor.getModel().setText(initialInput);

    this.storeFocusedElement();
    this.panel.show();
    this.miniEditor.focus();
  }

  close() {
    if (!this.panel.isVisible()) { return; }

    const miniEditorFocused = this.miniEditor.hasFocus();
    this.miniEditor.setText('');
    this.panel.hide();
    if (miniEditorFocused) { return this.restoreFocus(); }
  }

  confirm() {
    const inputText = this.miniEditor.getText();
    this.confirmFunc(inputText);
    const editor = atom.workspace.getActiveTextEditor();
    this.close();
  }

  storeFocusedElement() {
    this.previouslyFocusedElement = $(':focus');
  }

  restoreFocus() {
    if ((this.previouslyFocusedElement != null ? this.previouslyFocusedElement.isOnDom() : undefined)) {
      this.previouslyFocusedElement.focus();
    } else {
      atom.views.getView(atom.workspace).focus();
    }
  }

}
