/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const Style = require('./style')

export default class View {

  constructor(init, display) {
    this.style = new Style(display, {}, () => this.attributesChanged())
    this.classes = []
    this.initialized = false
    this.destroyed = false

    if (init) {
      this.initialize()
    }
  }

  initialize() {
    this.initialized = true
    etch.initialize(this)
  }

  render() {
    return <div></div>
  }

  update(props, children) {
    if (this.initialized) {
      return etch.update(this)
    } else {
      return Promise.resolve()
    }
  }

  addClass(c) {
    if (!this.classes.includes(c)) {
      this.classes.push(c)
      this.update()
    }
  }

  addClasses(cs) {
    if (cs) {
      cs.forEach(c => {
        if (!this.classes.includes(c)) {
          this.classes.push(c)
        }
      })

      this.update()
    }
  }

  append(child) {
    if (child instanceof View) {
      child = child.element
    }

    if (child) {
      this.element.appendChild(child)
    }
  }

  removeClass(c) {
    if (this.hasClass(c)) {
      this.classes = this.classes.filter(k => k !== c)
      this.update()
    }
  }

  hasClass(c) {
    return this.classes.includes(c)
  }

  getClassName() {
    return this.classes.join(' ')
  }

  getAttributes() {
    return {
      style: this.style.toString()
    }
  }

  attributesChanged() {
    this.update()
  }

  show() {
    this.style.show()
  }

  hide() {
    this.style.hide()
  }

  isHidden() {
    return this.style.isHidden()
  }

  isVisible() {
    return this.style.isVisible()
  }

  remove() {
    if (this.element) {
      this.element.remove()
    }
  }

  destroy() {
    if (!this.destroyed) {
      this.remove()
      this.destroyed = true
    }
  }

}