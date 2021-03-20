/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let SplitView;
const {$, View} = require('atom-space-pen-views');

module.exports =
(SplitView = class SplitView extends View {

  constructor(position, leftMin, rightMin, leftMax) {
    super();
    this.resizeStarted = this.resizeStarted.bind(this);
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeView = this.resizeView.bind(this);
    this.refreshPosition = this.refreshPosition.bind(this);
    if (position == null) { position = 250; }
    this.position = position;
    if (leftMin == null) { leftMin = 0; }
    this.leftMin = leftMin;
    if (rightMin == null) { rightMin = 0; }
    this.rightMin = rightMin;
    if (leftMax == null) { leftMax = undefined; }
    this.leftMax = leftMax;

    if (!this.leftMax) {
      this.leftMax = Number.MAX_SAFE_INTEGER;
    }
  }

  static content() {
    return this.div({class: 'split-view'}, () => {
      this.div({class: 'left', outlet: 'left'});
      this.div({class: 'divider'});
      return this.div({class: 'right', outlet: 'right'});
  });
  }

  getTitle() {
    return 'SplitView';
  }

  setLeftView(leftView) {
    if (this.leftView != null) {
      this.leftView.remove();
    }

    if ((leftView == null)) {
      leftView = $$(function() {
        return this.div;
      });
    }

    this.leftView = leftView;

    if (this.leftView != null) {
      this.leftView.css('height', '100%');
      this.leftView.css('overflow', 'auto');
      this.left.prepend(this.leftView);
    }

    return this.setPosition(this.position);
  }

  setRightView(rightView) {
    if (this.rightView != null) {
      this.rightView.remove();
    }

    if ((rightView == null)) {
      rightView = $$(function() {
        return this.div;
      });
    }

    this.rightView = rightView;

    if (this.rightView != null) {
      this.rightView.css('height', '100%');
      this.rightView.css('overflow', 'auto');
      this.right.prepend(this.rightView);
    }

    return this.setPosition(this.position);
  }

  initialize() {
    return this.on('mousedown', '.divider', e => this.resizeStarted(e));
  }

  attached() {
    this.setPosition(this.position);
    $(document).on('resize', this.refreshPosition);
    return $(window).on('resize', this.refreshPosition);
  }

  detached() {
    return $(window).off('resize', this.refreshPosition);
  }

  resizeStarted(e) {
    e.preventDefault();
    $(document).on('mousemove', this.resizeView);
    return $(document).on('mouseup', this.resizeStopped);
  }

  resizeStopped() {
    $(document).off('mousemove', this.resizeView);
    return $(document).off('mouseup', this.resizeStopped);
  }

  resizeView(e) {
    e.preventDefault();
    if (e.which !== 1) { return this.resizeStopped(); }
    const x = e.pageX - this.left.offset().left;
    if ((x > this.leftMin) && (x < this.leftMax) && (x < (this.width() - this.rightMin))) {
      return this.setPosition(x);
    }
  }

  refreshPosition() {
    return this.setPosition(this.position);
  }

  setPosition(position) {
    this.position = position;
    this.left.css('width', this.position);
    this.right.css('margin-left', this.position+3);
    this.right.css('width', this.width() - this.position - 3);

    if (this.leftView != null) {
      this.leftView.css('width', '100%');
    }
    if (this.rightView != null) {
      this.rightView.css('width', '100%');
    }
    if (this.leftView != null) {
      this.leftView.css('width', this.position);
    }
    return (this.rightView != null ? this.rightView.css('width', this.width() - this.position - 3) : undefined);
  }
});
