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

import { GestaeError } from "../error/GestaeError";
import { IApplicationContext } from "../application/IApplicationContext";
import { IPlugin } from "./IPlugin";
import { InitializationContext } from "../application/InitializationContext";
import { FinalizationContext } from "../application/FinalizationContext";

export const PluginStates = {
    Unloaded: "unloaded",
    Loaded:   "loaded",
    Started:  "started",
    Stopped:  "stopped"
};

export interface IPluginOptions {
    required?:     boolean;
    dependencies?: string[];
    [key: string]: any;
};

export abstract class AbstractPlugin<O extends IPluginOptions> implements IPlugin<O> {
    public  readonly options:    O;
    private          _state:     string = PluginStates.Unloaded;
    private          _canonical: string = "";
    private          _context:   IApplicationContext | undefined;

    constructor(options: O = {} as O) {
        this.options = options;
        this.setCanonicalName();
    }

    private setCanonicalName(): void {
        if(!this.domain || !this.version || !this.name || !this.uuid)
            throw GestaeError.toError("Plugin fields domain, version, name, and uuid are required.");
        this._canonical = `${this.domain}/${this.version}/${this.name}/${this.uuid}`;
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

    async doLoad(context: InitializationContext): Promise<void> {
        // do nothing 
    }

    async doStart(context: InitializationContext): Promise<void> {
        // do nothing 
    }

    async doStop(context: FinalizationContext): Promise<void> {
        // do nothing 
    }

    async doUnload(context: FinalizationContext): Promise<void> {
        // do nothing 
    }

    async load(context: InitializationContext): Promise<void> {
        this._context = context.applicationContext;
        await this.doLoad(context);
        this._state = PluginStates.Loaded;
    }

    async start(context: InitializationContext): Promise<void> {
        await this.doStart(context);
        this._state = PluginStates.Started;
    }
    
    async stop(context: FinalizationContext): Promise<void> {
        await this.doStop(context);
        this._state = PluginStates.Loaded;
    }

    async unload(context: FinalizationContext): Promise<void> {
        this._state = PluginStates.Unloaded;
        await this.doUnload(context);
    }
}
