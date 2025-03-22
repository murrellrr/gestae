/*
 *  Copyright (c) 2024, KRI, LLC.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { ILogger } from "../log/ILogger";
import { GestaeError } from "../error/GestaeError";
import { AbstractPlugin, IPluginOptions } from "./AbstractPlugin";
import { IPluginManager } from "./IPluginManager";
import { InitializationContext } from "../application/InitializationContext";
import { ApplicationContext } from "../application/ApplicationContext";

export class PluginManager implements IPluginManager {
    public  readonly plugins:         Record<string, AbstractPlugin<any>>;
    private readonly log:             ILogger;
    private          _sortedPlugins?: AbstractPlugin<any>[];

    constructor(log: ILogger) {
        this.plugins        = {};
        this.log            = log.child({ name: "PluginManager" });
    }

    addPlugin(plugin: AbstractPlugin<any>, options: IPluginOptions = {}): void {
        this.plugins[plugin.canonicalName] = plugin;
        plugin.manager = this;
    }

    getPlugin(uuid: string): AbstractPlugin<any> | undefined {
        for(const plugin of Object.values(this.plugins)) {
            if(plugin.uuid === uuid) return plugin;
        }
        return undefined;
    }

    getPluginByCanonicalName(name: string): AbstractPlugin<any> | undefined {
        return this.plugins[name];
    }

    /**
     * Returns plugins in the correct load order based on dependencies.
     * Throws an error if circular dependencies are detected.
     */
    getLoadOrder(): AbstractPlugin<any>[] {
        if(this._sortedPlugins) return this._sortedPlugins;

        this._sortedPlugins = [] as AbstractPlugin<any>[];
        const graph:    Map<string, Set<string>> = new Map();
        const inDegree: Map<string, number>      = new Map();

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
                inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
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
        if(this._sortedPlugins.length !== Object.keys(this.plugins).length) {
            const cyclicPlugins = Array.from(inDegree.entries())
                .filter(([, degree]) => degree > 0)
                .map(([pluginName]) => pluginName);
            throw new GestaeError(
                `Circular dependency detected involving plugin(s): ${cyclicPlugins.join(', ')}`
            );
        }

        return this._sortedPlugins;
    }
    
    async initialize(context: InitializationContext): Promise<void> {
        this.log.debug("PluginManager.initialize(): Initializing plugins...");
        const _ordered = this.getLoadOrder();
        for(const plugin of _ordered) {
            await plugin.load(context);
            this.log.debug(`PluginManager.initialize(): Plugin '${plugin.canonicalName}' loaded.`);
        }
        this.log.debug("PluginManager.initialize(): Plugins initialized.");
    }

    async start(context: ApplicationContext): Promise<void> {
        this.log.debug("PluginManager.start(): Starting plugins...");
        const _ordered = this.getLoadOrder();
        for(const plugin of _ordered) {
            await plugin.start(context);
            this.log.debug(`PluginManager.start(): Plugin '${plugin.canonicalName}' started.`);
        }
        this.log.debug("PluginManager.start(): Plugins started.");
    }
}