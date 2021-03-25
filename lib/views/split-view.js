/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const View = require('./view')
const _ = require('underscore-plus');

class Container extends View {

  constructor({ side }) {
    super(false)
    this.side = side
    this.initialize()
    this.setContent(new EmptyView())
  }

  setContent(content) {
    if (this.content) {
      this.content.remove()
    }

    this.content = content

    if (this.content) {
      this.element.appendChild(this.content.element)
    }
  }

  setWidth(width) {
    this.style.set('width', `${width}px`)
  }

  setMarginLeft(margin) {
    this.style.set('margin-left', `${margin}px`)
  }

  render() {
    return <div className={`process-palette-split-view-${this.side}`} attributes={this.getAttributes()} />
  }
}

class EmptyView extends View {

  constructor() {
    super(true)
  }

  render() {
    return <div></div>
  }

}

export default class SplitView extends View {

  constructor() {
    super(false);

    this.position = 250
    this.leftMin = 100
    this.rightMin = 100
    this.leftMax = Number.MAX_SAFE_INTEGER

    this.initialize()
  }

  render() {
    return <div className="process-palette-split-view">
      <Container ref="left" side="left" />
      <div className="process-palette-split-view-divider" on={{ mousedown: e => this.resizeStarted(e) }} />
      <Container ref="right" side="right" />
    </div>
  }

  getTitle() {
    return 'SplitView';
  }

  setLeftView(leftView) {
    if (this.leftView) {
      this.leftView.remove();
    }

    if (!leftView) {
      leftView = new EmptyView()
    }

    this.leftView = leftView;

    if (this.leftView) {
      this.leftView.style.set('height', '100%');
      this.leftView.style.set('overflow', 'auto');
      this.refs.left.setContent(this.leftView);
    }

    this.setPosition(this.position);
  }

  setRightView(rightView) {
    if (this.rightView) {
      this.rightView.remove();
    }

    if (!rightView) {
      rightView = new EmptyView()
    }

    this.rightView = rightView;

    if (this.rightView) {
      this.rightView.style.set('height', '100%');
      this.rightView.style.set('overflow', 'auto');
      this.refs.right.setContent(this.rightView);
    }

    this.setPosition(this.position);
  }

  resizeStarted(e) {
    e.preventDefault();
    this.mouseMoveListener = (e) => this.resizeView(e)
    this.mouseUpListener = () => this.resizeStopped()

    this.element.addEventListener('mousemove', this.mouseMoveListener)
    document.addEventListener('mouseup', this.mouseUpListener)
  }

  resizeStopped() {
    this.element.removeEventListener('mousemove', this.mouseMoveListener)
    document.removeEventListener('mouseup', this.mouseUpListener)
  }

  resizeView(e) {
    e.preventDefault();

    if (e.which !== 1) {
      this.resizeStopped();
      return
    }

    const rect = this.element.getBoundingClientRect();
    const x = e.pageX - rect.left;

    if ((x > this.leftMin) && (x < this.leftMax) && (x < (rect.width - this.rightMin))) {
      return this.setPosition(x);
    }
  }

  refreshPosition() {
    return this.setPosition(this.position);
  }

  setPosition(position) {
    const rect = this.element.getBoundingClientRect();
    this.position = position;
    this.refs.left.setWidth(this.position)
    // this.refs.right.setMarginLeft(this.position + 3)
    this.refs.right.setWidth(rect.width - this.position - 3)

    if (this.leftView) {
      this.leftView.style.set('width', `${this.position}px`)
    }

    if (this.rightView) {
      this.rightView.style.set('width', `${rect.width - this.position - 3}px`)
    }
  }

}
