export class Waypoint {
    constructor(options) {

        if (!options) {
            throw new Error('No options passed to Waypoint constructor')
        }
        if (!options.element) {
            throw new Error('No element option passed to Waypoint constructor')
        }
        if (!options.handler) {
            throw new Error('No handler option passed to Waypoint constructor')
        }

        this.key = 'waypoint-' + Waypoint.keyCounter
        this.options = Waypoint.Adapter.extend({}, Waypoint.defaults, options)
        this.element = this.options.element
        this.adapter = new Waypoint.Adapter(this.element)
        this.callback = options.handler
        this.axis = this.options.horizontal ? 'horizontal' : 'vertical'
        this.enabled = this.options.enabled
        this.triggerPoint = null
        this.group = Waypoint.Group.findOrCreate({
            name: this.options.group,
            axis: this.axis
        })
        this.context = Waypoint.Context.findOrCreateByElement(this.options.context)

        if (Waypoint.offsetAliases[this.options.offset]) {
            this.options.offset = Waypoint.offsetAliases[this.options.offset]
        }
        this.group.add(this)
        this.context.add(this)
        Waypoint.allWaypoints[this.key] = this
        Waypoint.keyCounter += 1
    }

    queueTrigger(direction) {
        this.group.queueTrigger(this, direction)
    }

    trigger(args) {
        if (!this.enabled) {
            return
        }
        if (this.callback) {
            this.callback.apply(this, args)
        }
    }
    destroy() {
        this.context.remove(this)
        this.group.remove(this)
        delete Waypoint.allWaypoints[this.key]
    }

    disable() {
        this.enabled = false
        return this
    }

    enable() {
        this.context.refresh()
        this.enabled = true
        return this
    }

    next() {
        return this.group.next(this)
    }

    previous() {
        return this.group.previous(this)
    }

    static invokeAll(method) {
        let allWaypointsArray = []
        for (let waypointKey in Waypoint.allWaypoints) {
            allWaypointsArray.push(Waypoint.allWaypoints[waypointKey])
        }
        for (let i = 0, end = allWaypointsArray.length; i < end; i++) {
            allWaypointsArray[i][method]()
        }
    }

    static destroyAll() {
        Waypoint.invokeAll('destroy')
    }

    static disableAll() {
        Waypoint.invokeAll('disable')
    }

    static enableAll() {
        Waypoint.Context.refreshAll()
        for (let waypointKey in Waypoint.allWaypoints) {
            Waypoint.allWaypoints[waypointKey].enabled = true
        }
        return this
    }

    static refreshAll() {
        Waypoint.Context.refreshAll()
    }

    static viewportHeight() {
        return window.innerHeight || document.documentElement.clientHeight
    }

    static viewportWidth() {
        return document.documentElement.clientWidth
    }

    static get offsetAliases() {
        let self = this;

        return {
            'bottom-in-view': function () {
                return self.context.innerHeight() - self.adapter.outerHeight()
            },
            'right-in-view': function () {
                return self.context.innerWidth() - self.adapter.outerWidth()
            }
        };
    }

    static requestAnimationFrame(callback) {
        let requestFn = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60)
            }
        requestFn.call(window, callback)
    }
}