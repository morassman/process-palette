/** @babel */

export default class Style {

  constructor(display, style, onChange) {
    this.display = display
    this.style = {}
    this.onChange = onChange

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

  changed() {
    if (this.onChange) {
      this.onChange()
    }
  }

  merge(style) {
    this.style = {
      ...this.style,
      ...style
    }
    this.changed()
  }

  set(key, value) {
    this.style[key] = value
    this.changed()
  }

  remove(key) {
    delete this.style[key]
    this.changed()
  }

  show() {
    if (this.display) {
      this.style.display = this.display
    } else {
      delete this.style.display
    }
    this.changed()
  }

  hide() {
    this.style.display = 'none'
    this.changed()
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