/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const Style = require('./style')

export default class View {

    constructor(init, display) {
        this.style = new Style(display)
        this.classes = []

        if (init) {
            this.initialize()
        }
    }

    initialize() {
        etch.initialize(this)
    }

    render() {
        return <div></div>
    }

    update(props, children) {
        return etch.update(this)
    }

    addClass(c) {
        if (!this.classes.includes(c)) {
            this.classes.push(c)
            etch.update(this)
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
            etch.update(this)
        }
    }

    hasClass(c) {
        return this.classes.includes(c)
    }

    getAttributes() {
        return {
            style: this.style.toString()
        }
    }

    show() {
        this.style.show()
        etch.update(this)
    }

    hide() {
        this.style.hide()
        etch.update(this)
    }

    isHidden() {
        return this.style.isHidden()
    }

    isVisible() {
        return this.style.isVisible()
    }

    detach() {
        this.element.remove()
    }

    destroy() {
        this.detach()
    }

}