import { IApplicationContext } from "./ApplicationContext";
import { CancelableEvent } from "./AsyncEventQueue";
import { GestaeError } from "./GestaeError";

export const PluginEvents = {
    uri: "gestaejs.com/api/events/plugin",
    LoadEvent: "load",
    StartEvent: "start",
    StopEvent: "stop",
    OnBeforeLoad: "gestaejs.com/api/events/plugin/load/OnBefore",
    OnLoad: "gestaejs.com/api/events/plugin/load/On",
    OnAfterLoad: "gestaejs.com/api/events/plugin/load/OnAfter",
    OnBeforeStart: "gestaejs.com/api/events/plugin/start/OnBefore",
    OnStart: "gestaejs.com/api/events/plugin/start/On",
    OnAfterStart: "gestaejs.com/api/events/plugin/start/OnAfter",
    OnBeforeStop: "gestaejs.com/api/events/plugin/stop/OnBefore",
    OnStop: "gestaejs.com/api/events/plugin/stop/On",
    OnAfterStop: "gestaejs.com/api/events/plugin/stop/OnAfter"
};

export const PluginStates = {
    Unloaded: "unloaded",
    Loaded: "loaded",
    Started: "started",
    Stopped: "stopped"
};

export class LoadPluginEvent extends CancelableEvent<Plugin> {
    constructor(plugin: Plugin) {
        super(PluginEvents.LoadEvent, plugin);
    }
}

export class StartPluginEvent extends CancelableEvent<Plugin> {
    constructor(plugin: Plugin) {
        super(PluginEvents.LoadEvent, plugin);
    }
}

export class StopPluginEvent extends CancelableEvent<Plugin> {
    constructor(plugin: Plugin) {
        super(PluginEvents.StopEvent, plugin);
    }
}

export abstract class Plugin {
    constructor(private _state: string = PluginStates.Unloaded, private _canonical: string = "") {
        this.setCanonicalName();
    }

    private setCanonicalName(): void {
        this._canonical = `${this.domain}/${this.version}/${this.name}`;
    }

    abstract get uuid(): string;
    abstract get name(): string;
    abstract get domain(): string;
    abstract get version(): string;
    abstract get vendor(): string;
    abstract get author(): string;
    abstract get description(): string;
    abstract get license(): string;

    get canonicalName(): string { 
        return this._canonical;
    }

    get required(): boolean {
        return false;
    }

    get dependencies(): string[] { 
        return [];
    }

    get state(): string {
        return this._state;
    }

    async load(context: IApplicationContext): Promise<void> {
        this._state = PluginStates.Loaded;
    }

    async start(context: IApplicationContext): Promise<void> {
        this._state = PluginStates.Started;
    }
    
    async stop(context: IApplicationContext): Promise<void> {
        this._state = PluginStates.Loaded;
    }
}

export class PluginManager {
    constructor(public readonly plugins: Record<string, Plugin>, private readonly _sortedPlugins: Plugin[] = []) {}

    /**
     * Returns plugins in the correct load order based on dependencies.
     * Throws an error if circular dependencies are detected.
     */
    getLoadOrder(): Plugin[] {
        const graph: Map<string, Set<string>> = new Map();
        const inDegree: Map<string, number> = new Map();

        // Initialize graph
        Object.values(this.plugins).forEach(plugin => {
            const pluginName = plugin.canonicalName;
            graph.set(pluginName, new Set(plugin.dependencies));
            inDegree.set(pluginName, 0);
        });

        // Compute in-degrees (number of dependencies each plugin has)
        Object.values(this.plugins).forEach(plugin => {
            plugin.dependencies.forEach(dep => {
                if(!graph.has(dep)) {
                    throw new Error(`Missing dependency: ${dep} required by ${plugin.canonicalName}`);
                }
                inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
            });
        });

        // Topological sorting (Kahn's Algorithm)
        //const loadOrder: Plugin[] = [];
        const queue: string[] = [];

        // Find plugins with no dependencies (in-degree 0)
        inDegree.forEach((count, pluginName) => {
            if(count === 0) queue.push(pluginName);
        });

        while(queue.length > 0) {
            const pluginName = queue.shift()!;
            const plugin = this.plugins[pluginName];
            this._sortedPlugins.push(plugin);

            // Reduce in-degree of dependent plugins
            graph.get(pluginName)?.forEach(dep => {
                inDegree.set(dep, inDegree.get(dep)! - 1);
                if (inDegree.get(dep) === 0) {
                    queue.push(dep);
                }
            });
        }

        // Check if there's a circular dependency (graph not fully processed)
        if(this._sortedPlugins.length !== Object.keys(this.plugins).length)
            throw new GestaeError("Circular dependency detected!");

        return this._sortedPlugins;
    }
}