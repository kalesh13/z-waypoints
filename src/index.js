import {
    Waypoint
} from './lib/waypoint';
import {
    Context
} from './lib/context';
import {
    Group
} from './lib/group';
import {
    NoFrameworkAdapter
} from './lib/noFrameworkAdapter';

Waypoint.keyCounter = 0;
Waypoint.allWaypoints = {};
Waypoint.adapters = []

Waypoint.defaults = {
    context: window,
    continuous: true,
    enabled: true,
    group: 'default',
    horizontal: false,
    offset: 0
}

window.Waypoint = Waypoint;

let oldWindowLoad = window.onload

window.onload = function () {
    if (oldWindowLoad) {
        oldWindowLoad()
    }
    Context.refreshAll()
}

Waypoint.Context = Context;
Waypoint.Group = Group;

Waypoint.adapters.push({
    name: 'noframework',
    Adapter: NoFrameworkAdapter
})
Waypoint.Adapter = NoFrameworkAdapter;

export default Waypoint;