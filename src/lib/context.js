export class Context {
    constructor(element) {

        this.keyCounter = 0
        this.contexts = {}
        this.Waypoint = window.Waypoint

        this.element = element
        this.Adapter = this.Waypoint.Adapter
        this.adapter = new this.Adapter(element)
        this.key = 'waypoint-context-' + this.keyCounter
        this.didScroll = false
        this.didResize = false
        this.oldScroll = {
            x: this.adapter.scrollLeft(),
            y: this.adapter.scrollTop()
        }
        this.waypoints = {
            vertical: {},
            horizontal: {}
        }

        element.waypointContextKey = this.key
        this.contexts[element.waypointContextKey] = this
        this.keyCounter += 1

        if (!this.Waypoint.windowContext) {
            this.Waypoint.windowContext = true
            this.Waypoint.windowContext = new Context(window)
        }

        this.createThrottledScrollHandler()
        this.createThrottledResizeHandler()
    }

    add(waypoint) {
        let axis = waypoint.options.horizontal ? 'horizontal' : 'vertical'
        this.waypoints[axis][waypoint.key] = waypoint
        this.refresh()
    }

    checkEmpty() {
        let horizontalEmpty = this.Adapter.isEmptyObject(this.waypoints.horizontal)
        let verticalEmpty = this.Adapter.isEmptyObject(this.waypoints.vertical)
        let isWindow = this.element == this.element.window

        if (horizontalEmpty && verticalEmpty && !isWindow) {
            this.adapter.off('.waypoints')
            delete this.contexts[this.key]
        }
    }

    createThrottledResizeHandler() {
        let self = this

        let resizeHandler = () => {
            self.handleResize()
            self.didResize = false
        }

        this.adapter.on('resize.waypoints', function () {
            if (!self.didResize) {
                self.didResize = true
                self.Waypoint.requestAnimationFrame(resizeHandler)
            }
        })
    }

    createThrottledScrollHandler() {
        let self = this

        let scrollHandler = () => {
            self.handleScroll()
            self.didScroll = false
        }

        this.adapter.on('scroll.waypoints', function () {
            if (!self.didScroll || self.Waypoint.isTouch) {
                self.didScroll = true
                self.Waypoint.requestAnimationFrame(scrollHandler)
            }
        })
    }

    handleResize() {
        this.Waypoint.Context.refreshAll()
    }

    handleScroll() {
        let triggeredGroups = {}
        let axes = {
            horizontal: {
                newScroll: this.adapter.scrollLeft(),
                oldScroll: this.oldScroll.x,
                forward: 'right',
                backward: 'left'
            },
            vertical: {
                newScroll: this.adapter.scrollTop(),
                oldScroll: this.oldScroll.y,
                forward: 'down',
                backward: 'up'
            }
        }

        for (let axisKey in axes) {
            let axis = axes[axisKey]
            let isForward = axis.newScroll > axis.oldScroll
            let direction = isForward ? axis.forward : axis.backward

            for (let waypointKey in this.waypoints[axisKey]) {
                let waypoint = this.waypoints[axisKey][waypointKey]

                if (waypoint.triggerPoint === null) {
                    continue
                }
                let wasBeforeTriggerPoint = axis.oldScroll < waypoint.triggerPoint
                let nowAfterTriggerPoint = axis.newScroll >= waypoint.triggerPoint
                let crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint
                let crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint
                if (crossedForward || crossedBackward) {
                    waypoint.queueTrigger(direction)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
            }
        }

        for (let groupKey in triggeredGroups) {
            triggeredGroups[groupKey].flushTriggers()
        }

        this.oldScroll = {
            x: axes.horizontal.newScroll,
            y: axes.vertical.newScroll
        }
    }

    innerHeight() {
        /*eslint-disable eqeqeq */
        if (this.element == this.element.window) {
            return this.Waypoint.viewportHeight()
        }
        /*eslint-enable eqeqeq */
        return this.adapter.innerHeight()
    }

    remove(waypoint) {
        delete this.waypoints[waypoint.axis][waypoint.key]
        this.checkEmpty()
    }

    innerWidth() {
        /*eslint-disable eqeqeq */
        if (this.element == this.element.window) {
            return this.Waypoint.viewportWidth()
        }
        /*eslint-enable eqeqeq */
        return this.adapter.innerWidth()
    }

    destroy() {
        let allWaypoints = []
        for (let axis in this.waypoints) {
            for (let waypointKey in this.waypoints[axis]) {
                allWaypoints.push(this.waypoints[axis][waypointKey])
            }
        }
        for (let i = 0, end = allWaypoints.length; i < end; i++) {
            allWaypoints[i].destroy()
        }
    }

    refresh() {
        /*eslint-disable eqeqeq */
        let isWindow = this.element == this.element.window
        /*eslint-enable eqeqeq */
        let contextOffset = isWindow ? undefined : this.adapter.offset()
        let triggeredGroups = {}
        let axes

        this.handleScroll()
        axes = {
            horizontal: {
                contextOffset: isWindow ? 0 : contextOffset.left,
                contextScroll: isWindow ? 0 : this.oldScroll.x,
                contextDimension: this.innerWidth(),
                oldScroll: this.oldScroll.x,
                forward: 'right',
                backward: 'left',
                offsetProp: 'left'
            },
            vertical: {
                contextOffset: isWindow ? 0 : contextOffset.top,
                contextScroll: isWindow ? 0 : this.oldScroll.y,
                contextDimension: this.innerHeight(),
                oldScroll: this.oldScroll.y,
                forward: 'down',
                backward: 'up',
                offsetProp: 'top'
            }
        }

        for (let axisKey in axes) {
            let axis = axes[axisKey]
            for (let waypointKey in this.waypoints[axisKey]) {
                let waypoint = this.waypoints[axisKey][waypointKey]
                let adjustment = waypoint.options.offset
                let oldTriggerPoint = waypoint.triggerPoint
                let elementOffset = 0
                let freshWaypoint = oldTriggerPoint == null
                let contextModifier, wasBeforeScroll, nowAfterScroll
                let triggeredBackward, triggeredForward

                if (waypoint.element !== waypoint.element.window) {
                    elementOffset = waypoint.adapter.offset()[axis.offsetProp]
                }

                if (typeof adjustment === 'function') {
                    adjustment = adjustment.apply(waypoint)
                } else if (typeof adjustment === 'string') {
                    adjustment = parseFloat(adjustment)
                    if (waypoint.options.offset.indexOf('%') > -1) {
                        adjustment = Math.ceil(axis.contextDimension * adjustment / 100)
                    }
                }

                contextModifier = axis.contextScroll - axis.contextOffset
                waypoint.triggerPoint = Math.floor(elementOffset + contextModifier - adjustment)
                wasBeforeScroll = oldTriggerPoint < axis.oldScroll
                nowAfterScroll = waypoint.triggerPoint >= axis.oldScroll
                triggeredBackward = wasBeforeScroll && nowAfterScroll
                triggeredForward = !wasBeforeScroll && !nowAfterScroll

                if (!freshWaypoint && triggeredBackward) {
                    waypoint.queueTrigger(axis.backward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                } else if (!freshWaypoint && triggeredForward) {
                    waypoint.queueTrigger(axis.forward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                } else if (freshWaypoint && axis.oldScroll >= waypoint.triggerPoint) {
                    waypoint.queueTrigger(axis.forward)
                    triggeredGroups[waypoint.group.id] = waypoint.group
                }
            }
        }

        this.Waypoint.requestAnimationFrame(function () {
            for (let groupKey in triggeredGroups) {
                triggeredGroups[groupKey].flushTriggers()
            }
        })

        return this
    }

    static findOrCreateByElement(element) {
        return Context.findByElement(element) || new Context(element)
    }

    static refreshAll() {
        for (let contextId in this.contexts) {
            this.contexts[contextId].refresh()
        }
    }

    static findByElement(element) {
        if (this.contexts) {
            return this.contexts[element.waypointContextKey]
        }
    }
}