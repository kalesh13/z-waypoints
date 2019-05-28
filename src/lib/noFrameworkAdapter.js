export class NoFrameworkAdapter {
    constructor(element) {
        this.Waypoint = window.Waypoint

        this.element = element
        this.handlers = {}
    }

    innerHeight() {
        var isWin = this.isWindow(this.element)
        return isWin ? this.element.innerHeight : this.element.clientHeight
    }

    innerWidth() {
        var isWin = this.isWindow(this.element)
        return isWin ? this.element.innerWidth : this.element.clientWidth
    }

    isWindow(element) {
        return element === element.window
    }

    getWindow(element) {
        if (this.isWindow(element)) {
            return element
        }
        return element.defaultView
    }

    off(event, handler) {
        let removeListeners = (element, listeners, handler) => {
            for (var i = 0, end = listeners.length - 1; i < end; i++) {
                var listener = listeners[i]
                if (!handler || handler === listener) {
                    element.removeEventListener(listener)
                }
            }
        }

        var eventParts = event.split('.')
        var eventType = eventParts[0]
        var namespace = eventParts[1]
        var element = this.element

        if (namespace && this.handlers[namespace] && eventType) {
            removeListeners(element, this.handlers[namespace][eventType], handler)
            this.handlers[namespace][eventType] = []
        } else if (eventType) {
            for (var ns in this.handlers) {
                removeListeners(element, this.handlers[ns][eventType] || [], handler)
                this.handlers[ns][eventType] = []
            }
        } else if (namespace && this.handlers[namespace]) {
            for (var type in this.handlers[namespace]) {
                removeListeners(element, this.handlers[namespace][type], handler)
            }
            this.handlers[namespace] = {}
        }
    }

    offset() {
        if (!this.element.ownerDocument) {
            return null
        }

        var documentElement = this.element.ownerDocument.documentElement
        var win = this.getWindow(this.element.ownerDocument)
        var rect = {
            top: 0,
            left: 0
        }

        if (this.element.getBoundingClientRect) {
            rect = this.element.getBoundingClientRect()
        }

        return {
            top: rect.top + win.pageYOffset - documentElement.clientTop,
            left: rect.left + win.pageXOffset - documentElement.clientLeft
        }
    }

    on(event, handler) {
        var eventParts = event.split('.')
        var eventType = eventParts[0]
        var namespace = eventParts[1] || '__default'
        var nsHandlers = this.handlers[namespace] = this.handlers[namespace] || {}
        var nsTypeList = nsHandlers[eventType] = nsHandlers[eventType] || []

        nsTypeList.push(handler)
        this.element.addEventListener(eventType, handler)
    }

    outerHeight(includeMargin) {
        var height = this.innerHeight()
        var computedStyle

        if (includeMargin && !this.isWindow(this.element)) {
            computedStyle = window.getComputedStyle(this.element)
            height += parseInt(computedStyle.marginTop, 10)
            height += parseInt(computedStyle.marginBottom, 10)
        }

        return height
    }

    outerWidth(includeMargin) {
        var width = this.innerWidth()
        var computedStyle

        if (includeMargin && !this.isWindow(this.element)) {
            computedStyle = window.getComputedStyle(this.element)
            width += parseInt(computedStyle.marginLeft, 10)
            width += parseInt(computedStyle.marginRight, 10)
        }

        return width
    }

    scrollLeft() {
        var win = this.getWindow(this.element)
        return win ? win.pageXOffset : this.element.scrollLeft
    }

    scrollTop() {
        var win = this.getWindow(this.element)
        return win ? win.pageYOffset : this.element.scrollTop
    }

    static extend() {
        var args = Array.prototype.slice.call(arguments)

        let merge = (target, obj) => {
            if (typeof target === 'object' && typeof obj === 'object') {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        target[key] = obj[key]
                    }
                }
            }
            return target
        }

        for (var i = 1, end = args.length; i < end; i++) {
            merge(args[0], args[i])
        }
        return args[0]
    }

    static inArray(element, array, i) {
        return array == null ? -1 : array.indexOf(element, i)
    }

    static isEmptyObject(obj) {
        /* eslint no-unused-vars: 0 */
        for (var name in obj) {
            return false
        }
        return true
    }
}