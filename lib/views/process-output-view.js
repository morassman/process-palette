/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const _ = require('underscore-plus');
const {CompositeDisposable} = require('atom');
const ButtonsView = require('./buttons-view');
const PathView = require('./path-view');
const escapeHTML = require('underscore.string/escapeHTML');
const AnsiToHtml = require('ansi-to-html');

export default class ProcessOutputView extends View {

  constructor(main, processController) {
    super(false)
    this.main = main;
    this.processController = processController;
    this.lastScrollTop = 0;
    this.scrollLocked = false;
    this.ansiConvert = new AnsiToHtml({stream:true});
    this.lineIndex = 0;
    this.patterns = this.processController.configController.patterns;

    // this.addProcessDetails();
    this.setScrollLockEnabled(this.processController.config.scrollLockEnabled);
    this.initialize()
  }

  render() {
    const fontFamily = atom.config.get("editor.fontFamily");

    return <div className="process-palette-process-output-view">
      <div className="process-palette-process-view process-palette-process-view-output">
        <div className="process-palette-process-view-toolbar">
          <button ref="runButton" className="btn btn-sm btn-fw icon-playback-play inline-block-tight" on={{ click: () => this.runButtonPressed(), mousedown: e => e.preventDefault() }} />
          {this.processController.config.keystroke &&
            <span ref="keystroke" className="process-palette-process-view-keystroke inline-block">
              {_.humanizeKeystroke(this.processController.config.keystroke)}
            </span>}
          <ButtonsView ref="buttonsView" configController={this.processController.configController} parentProcessController={this.processController} />
          <span className="btn-toolbar">
            <button ref="clearButton" className="btn btn-sm btn-fw icon-trashcan" on={{ click: () => this.clearOutput(), mousedown: e => e.preventDefault() }} />
            <button ref="scrollLockButton" className="btn btn-sm btn-fw icon-lock" on={{ click: () => this.toggleScrollLock(), mousedown: e => e.preventDefault() }} />
          </span>
        </div>
      </div>
      <div ref="outputPanel" className="process-palette-process-output-view-panel native-key-bindings" attributes={{ style: `font-family: ${fontFamily}` }} tabindex={1} on={{ mousedown: this.onOutputPanelMouseDown, scroll: this.onOutputPanelScroll, mousewheel: e => this.onOutputPanelMouseWheel(e) }} />
    </div>
  }

  onOutputPanelMouseDown() {
    // Only do this while the process is running.
    if (this.processController.process) {
      this.setScrollLockEnabled(true);
    }
  }

  onOutputPanelScroll() {
    this.lastScrollTop = this.refs.outputPanel.scrollTop;
  }

  onOutputPanelMouseWheel(e) {
    if (!this.processController.process) {
      return;
    }

    const delta = e.deltaY;

    if (delta < 0) {
      this.setScrollLockEnabled(true);
    } else if (delta > 0) {
      this.disableScrollLockIfAtBottom();
    }
  }

  initialize() {
    super.initialize()
    this.disposables = new CompositeDisposable();

    this.addToolTips();
    this.refreshScrollLockButton();
    this.processController.addProcessCallback(this);
    this.outputChanged();
  }

  addToolTips() {
    // this.disposables.add(atom.tooltips.add(this.refs.scrollLockButton, { title: 'Scroll lock' }));
    // this.disposables.add(atom.tooltips.add(this.refs.clearButton, { title: 'Clear output' }));
    // this.disposables.add(atom.tooltips.add(this.refs.runButton, { title: 'Run process' }));
  }

  disableScrollLockIfAtBottom() {
    if ((this.refs.outputPanel.clientHeight + this.refs.outputPanel.scrollTop) === this.refs.outputPanel.scrollHeight) {
      if (this.refs.outputPanel.scrollTop > 0) {
        this.setScrollLockEnabled(false);
      }
    }
  }

  attached() {
    this.outputChanged();
  }

  show() {
    super.show();
    this.outputChanged();
  }

  processStarted() {}

  processStopped() {}

  setScrollLockEnabled(enabled) {
    if (this.scrollLocked === enabled) {
      return;
    }

    this.scrollLocked = enabled;
    return this.refreshScrollLockButton();
  }

  showListView() {
    return this.main.showListView();
  }

  runButtonPressed() {
    return this.processController.configController.runProcess();
  }

  toggleScrollLock() {
    return this.setScrollLockEnabled(!this.scrollLocked);
  }

  refreshScrollLockButton() {
    this.refs.scrollLockButton.classList.remove("btn-warning");

    if (this.scrollLocked) {
      return this.refs.scrollLockButton.classList.add("btn-warning");
    }
  }

  streamOutput(output) {
    this.outputChanged();
  }

  clearOutput() {
    this.lastScrollTop = 0;
    this.refs.outputPanel.innerHTML = "";
    this.outputChanged();
  }

  outputChanged() {
    if (this.scrollLocked) {
      this.refs.outputPanel.scrollTop = this.lastScrollTop;
    } else {
      this.refs.outputPanel.scrollTop = this.refs.outputPanel.scrollHeight - this.refs.outputPanel.clientHeight
    }

    this.refreshScrollLockButton();
  }

  outputToPanel(text) {
    text = this.sanitizeOutput(text);
    let addNewLine = false;

    text.split('\n').forEach(line => {
      if (addNewLine) {
        // this.refs.outputPanel.appendChild(document.createElement("br"))
        this.lineIndex++
      }
      this.appendLine(line)
      addNewLine = true
    })
  }

  appendLine(line) {
    for (let pattern of this.patterns) {
      const match = pattern.match(line);

      if (match != null) {
        const cwd = this.processController.getCwd();
        var pathView = new PathView(cwd, match);
        this.refs.outputPanel.insertAdjacentHTML("beforeend", match.pre);
        this.refs.outputPanel.append(pathView.element)
        this.refs.outputPanel.insertAdjacentHTML("beforeend", match.post);
        return;
      }
    }

    this.refs.outputPanel.insertAdjacentHTML("beforeend", line);
  }

  // Tear down any state and remove
  destroy() {
    if (this.processController) {
      this.processController.removeProcessCallback(this);
    }

    this.refs.buttonsView.destroy();
    this.disposables.dispose();
    super.destroy()
  }

  getElement() {
    return this.element;
  }

  sanitizeOutput(output) {
    // Prevent HTML in output from being parsed as HTML
    output = escapeHTML(output);

    // Convert ANSI escape sequences (ex. colors) to HTML
    return this.ansiConvert.toHtml(output);
  }

}
