/** @babel */

export default class Style {

  constructor(style) {
    this.style = { visibility: 'visible' }

    if (style) {
      this.style = {
        ...this.style,
        ...style
      }
    }
  }

  show() {
    this.style.visibility = 'visible'
  }

  hide() {
    this.style.visibility = 'hidden'
  }

  isHidden() {
    return this.style.visibility === 'hidden'
  }

  isVisible() {
    return this.style.visibility === 'visible'
  }

  toString() {
    return Object.entries(this.style).map(e => `${e[0]}:${e[1]}`).join(';')
  }
}