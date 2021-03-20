/** @babel */

export default class Style {

  constructor(display, style) {
    this.display = display
    this.style = {}

    if (display) {
      this.style.display = display
    }

    if (style) {
      this.style = {
        ...this.style,
        ...style
      }
    }
  }

  merge(style) {
    this.style = {
      ...this.style,
      ...style
    }
  }

  set(key, value) {
    this.style[key] = value
  }

  remove(key) {
    delete this.style[key]
  }

  show() {
    if (this.display) {
      this.style.display = this.display
    } else {
      delete this.style.display
    }
  }

  hide() {
    this.style.display = 'none'
  }

  isHidden() {
    return this.style.display === 'none'
  }

  isVisible() {
    return this.style.display !== 'none'
  }

  toString() {
    return Object.entries(this.style).map(e => `${e[0]}:${e[1]}`).join(';')
  }
}