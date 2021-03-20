/** @babel */
/** @jsx etch.dom */

const etch = require('etch')
const Style = require('./style')

export default class View {

    constructor(init, display) {
        this.style = new Style(display, {}, () => this.update())
        this.classes = []
        this.initialized = false

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

    getAttributes() {
        return {
            style: this.style.toString()
        }
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
        this.element.remove()
    }

    destroy() {
        this.remove()
    }

}