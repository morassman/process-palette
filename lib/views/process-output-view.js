/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let ProcessOutputView;
const _ = require('underscore-plus');
const {$$, View} = require('atom-space-pen-views');
const {CompositeDisposable} = require('atom');
const ButtonsView = require('./buttons-view');
const PathView = require('./path-view');
const escapeHTML = require('underscore.string/escapeHTML');
const AnsiToHtml = require('ansi-to-html');

module.exports =
(ProcessOutputView = class ProcessOutputView extends View {

  constructor(main, processController) {
    super(main, processController);
    this.main = main;
    this.processController = processController;
    this.addProcessDetails = this.addProcessDetails.bind(this);
    this.calculateHeight = this.calculateHeight.bind(this);
    this.processStarted = this.processStarted.bind(this);
    this.processStopped = this.processStopped.bind(this);
    this.streamOutput = this.streamOutput.bind(this);
    this.lastScrollTop = 0;
    this.scrollLocked = false;
    this.ansiConvert = new AnsiToHtml({stream:true});
    this.lineIndex = 0;
    this.patterns = this.processController.configController.patterns;

    this.addProcessDetails();
    this.setScrollLockEnabled(this.processController.config.scrollLockEnabled);
  }

  static content(main, processController) {
    return this.div({class:'process-output-view'}, () => {
      this.div({class:'process-list-item', outlet:'header'}, () => {
        return this.div({class:'process-toolbar'}, () => {
          this.button({class:'btn btn-sm btn-fw icon-three-bars inline-block-tight', outlet:'showListViewButton', click:'showListView'});
          this.button({class:'btn btn-sm btn-fw icon-playback-play inline-block-tight', outlet:'runButton', click:'runButtonPressed'});
          this.span({class:'header inline-block text-highlight', outlet: 'commandName'});
          this.span({class:'keystroke inline-block highlight', outlet:'keystroke'});
          this.span({class:'btn-group'}, () => {
            this.button({class:'btn btn-sm btn-fw icon-trashcan', outlet:'clearButton', click:'clearOutput'});
            return this.button({class:'btn btn-sm btn-fw icon-lock', style:'margin-right:15px', outlet:'scrollLockButton', click:'toggleScrollLock'});
        });
          return this.subview("buttonsView", new ButtonsView(processController.configController, processController));
        });
      });
      return this.div({class:"output-panel native-key-bindings", tabindex: -1, outlet:'outputPanel'});
  });
  }

  initialize() {
    this.disposables = new CompositeDisposable();

    const fontFamily = atom.config.get("editor.fontFamily");
    this.outputPanel.css("font-family", fontFamily);

    this.addEventHandlers();
    this.addToolTips();
    this.refreshScrollLockButton();
    this.processController.addProcessCallback(this);
    return this.outputChanged();
  }

  addProcessDetails() {
    this.commandName.text(_.humanizeEventName(this.processController.config.getCommandName()));

    if (this.processController.config.keystroke) {
      this.keystroke.text(_.humanizeKeystroke(this.processController.config.keystroke));
      return this.keystroke.show();
    } else {
      this.keystroke.text("");
      return this.keystroke.hide();
    }
  }

  addEventHandlers() {
    // Prevent the buttons from getting focus.
    this.showListViewButton.on('mousedown', e => e.preventDefault());

    this.runButton.on('mousedown', e => e.preventDefault());

    this.scrollLockButton.on('mousedown', e => e.preventDefault());

    this.clearButton.on('mousedown', e => e.preventDefault());

    this.outputPanel.on('mousedown', e => {
      // Only do this while the process is running.
      if (this.processController.process) {
        return this.setScrollLockEnabled(true);
      }
    });

    this.outputPanel.on('mousewheel', e => {
      if (!this.processController.process) {
        return;
      }

      const delta = e.originalEvent.deltaY;

      if (delta < 0) {
        return this.setScrollLockEnabled(true);
      } else if (delta > 0) {
        return this.disableScrollLockIfAtBottom();
      }
    });

    return this.outputPanel.on('scroll', e => {
      return this.lastScrollTop = this.outputPanel.scrollTop();
    });
  }

  addToolTips() {
    this.disposables.add(atom.tooltips.add(this.showListViewButton, {title: 'Show palette'}));
    this.disposables.add(atom.tooltips.add(this.scrollLockButton, {title: 'Scroll lock'}));
    this.disposables.add(atom.tooltips.add(this.clearButton, {title: 'Clear output'}));
    return this.disposables.add(atom.tooltips.add(this.runButton, {title: 'Run process'}));
  }

  disableScrollLockIfAtBottom() {
    if ((this.outputPanel.height() + this.outputPanel.scrollTop()) === this.outputPanel.get(0).scrollHeight) {
      if (this.outputPanel.scrollTop() > 0) {
        return this.setScrollLockEnabled(false);
      }
    }
  }
    // else
      // @setScrollLockEnabled(true);

  parentHeightChanged(parentHeight) {
    return this.calculateHeight();
  }

  attached() {
    return this.outputChanged();
  }

  show() {
    super.show();
    return this.outputChanged();
  }

  calculateHeight() {}
    // @outputPanel.height(@main.mainView.height() - @header.height() - 5);

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
    this.scrollLockButton.removeClass("btn-warning");

    if (this.scrollLocked) {
      return this.scrollLockButton.addClass("btn-warning");
    }
  }

  streamOutput(output) {
    return this.outputChanged();
  }

  clearOutput() {
    this.lastScrollTop = 0;
    this.outputPanel.text("");
    return this.outputChanged();
  }

  outputChanged() {
    this.calculateHeight();

    if (this.scrollLocked) {
      this.outputPanel.scrollTop(this.lastScrollTop);
    } else {
      this.outputPanel.scrollTop(this.outputPanel.get(0).scrollHeight);
    }

    return this.refreshScrollLockButton();
  }

  outputToPanel(text) {
    text = this.sanitizeOutput(text);
    let addNewLine = false;

    return (() => {
      const result = [];
      for (let line of Array.from(text.split('\n'))) {
        if (addNewLine) {
          this.outputPanel.append("<br>");
          this.lineIndex++;
        }
        this.appendLine(line);
        result.push(addNewLine = true);
      }
      return result;
    })();
  }

  appendLine(line) {
    if (this.patterns.length === 0) {
      this.outputPanel.append(line);
      return;
    }

    for (let pattern of Array.from(this.patterns)) {
      const match = pattern.match(line);

      if (match != null) {
        const cwd = this.processController.getCwd();
        var pathView = new PathView(cwd, match);
        this.outputPanel.append(match.pre);
        this.outputPanel.append($$(function() {
          return this.span(() => {
            return this.subview(`${this.lineIndex}`, pathView);
          });
        })
        );
        this.outputPanel.append(match.post);
        return;
      }
    }

    return this.outputPanel.append(line);
  }

  // Tear down any state and detach
  destroy() {
    if (this.processController) {
      this.processController.removeProcessCallback(this);
    }

    this.buttonsView.destroy();
    this.disposables.dispose();
    return this.element.remove();
  }

  getElement() {
    return this.element;
  }

  sanitizeOutput(output) {
    // Prevent HTML in output from being parsed as HTML
    output = escapeHTML(output);
    // Convert ANSI escape sequences (ex. colors) to HTML
    output = this.ansiConvert.toHtml(output);

    return output;
  }
});
