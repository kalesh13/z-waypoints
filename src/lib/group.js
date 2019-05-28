export class Group {

    constructor(options) {
        this.groups = {
            vertical: {},
            horizontal: {}
        };
        this.Waypoint = window.Waypoint

        this.name = options.name
        this.axis = options.axis
        this.id = this.name + '-' + this.axis
        this.waypoints = []
        this.clearTriggerQueues()
        this.groups[this.axis][this.name] = this
    }

    add(waypoint) {
        this.waypoints.push(waypoint)
    }

    clearTriggerQueues() {
        this.triggerQueues = {
            up: [],
            down: [],
            left: [],
            right: []
        }
    }

    flushTriggers() {
        for (let direction in this.triggerQueues) {
            let waypoints = this.triggerQueues[direction]
            let reverse = direction === 'up' || direction === 'left'
            waypoints.sort(reverse ? this.byReverseTriggerPoint : this.byTriggerPoint)

            for (let i = 0, end = waypoints.length; i < end; i += 1) {
                let waypoint = waypoints[i]
                if (waypoint.options.continuous || i === waypoints.length - 1) {
                    waypoint.trigger([direction])
                }
            }
        }
        this.clearTriggerQueues()
    }

    next(waypoint) {
        this.waypoints.sort(this.byTriggerPoint)
        let index = this.Waypoint.Adapter.inArray(waypoint, this.waypoints)
        let isLast = index === this.waypoints.length - 1
        return isLast ? null : this.waypoints[index + 1]
    }

    previous(waypoint) {
        this.waypoints.sort(this.byTriggerPoint)
        let index = this.Waypoint.Adapter.inArray(waypoint, this.waypoints)
        return index ? this.waypoints[index - 1] : null
    }

    queueTrigger(waypoint, direction) {
        this.triggerQueues[direction].push(waypoint)
    }

    remove(waypoint) {
        let index = this.Waypoint.Adapter.inArray(waypoint, this.waypoints)
        if (index > -1) {
            this.waypoints.splice(index, 1)
        }
    }

    first() {
        return this.waypoints[0]
    }

    last() {
        return this.waypoints[this.waypoints.length - 1]
    }

    byTriggerPoint(a, b) {
        return a.triggerPoint - b.triggerPoint
    }

    byReverseTriggerPoint(a, b) {
        return b.triggerPoint - a.triggerPoint
    }

    static findOrCreate(options) {
        if (this.groups && this.groups[options.axis]) {
            return this.groups[options.axis][options.name] || new Group(options)
        }
        return new Group(options);
    }
}