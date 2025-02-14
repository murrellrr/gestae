import { IApplicationContext } from "./ApplicationContext";
import { ListenerItem } from "./AsyncEventEmitter";
import { NotFoundError } from "./GestaeError";
import { GestaeEvent, GestaeHttpEvent } from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { Model, DefaultModel } from "./Model";

export type ModelType = (new (...args: any[]) => Model) | string;

export interface PartOptions {
    name?: string;
}

/**
 * @description A "Part" is a peice of a URI representing a namespace, resource, or action.
 * @author Robert R Murrell
 * @copyright Copyright (c) 2025, Dark Fox Technology, LLC.
 * @license MIT
 */
export abstract class Part {
    private _initialized: boolean = false;
    protected _applicationContext: IApplicationContext | undefined;
    protected readonly _name: string;
    protected _path: string;
    protected _parent: Part | undefined;
    protected readonly _ModelClass: new (...args: any[]) => Model;
    public listeners: ListenerItem[] = [];
    public readonly children: Record<string, Part> = {};

    constructor(_ModelClass: ModelType, options: PartOptions = {}) {
        if(typeof _ModelClass === "string") {
            this._name = options?.name?.toLowerCase() ?? _ModelClass;
            this._ModelClass = DefaultModel;
        }
        else {
            this._ModelClass = _ModelClass as new (...args: any[]) => Model;
            this._name = options?.name?.toLowerCase() ?? this._ModelClass.name.toLowerCase();
        }
        this._path = this._name;
        this._resolveListenerFunctions();
    }

    protected _resolveListenerFunctions() {
        // // Update any decorated event listeners to have a name and bound to this instance.
        const _listeners = (this._ModelClass as any).__events ?? [];
        for(const _listener of _listeners) {
            _listener.method = this._ModelClass.prototype[_listener.method];
            _listener.once = _listener.once ?? false;
        }
    }

    /**
     * @description The type of part this is.
     */
    protected abstract get type(): string;

    /**
     * @description The event path of this part in the application. Usually 
     *              gestaejs.[Type].[Path.To.Next.Part].[Name].[Operation].[Event]
     * @example gestaejs.resource.api.company.person.read.before
     */
    get path(): string {
        return this._path;
    }

    get name() {
        return this._name;
    }

    get model(): Model {
        return this._ModelClass.prototype;
    }

    createModelInstance(id: string): Model {
        return new this._ModelClass(id);
    }

    protected _setPath(): void {
        // Setting up this part URI.
        let _parent = this._parent;
        while(_parent) {
            this._path = `${_parent._name}.${this._path}`;
            _parent = _parent._parent;
        }
        this._path = `gestaejs.${this.type}.${this._path}`;
    }

    protected _registerListeners(): void {
        // Example full event path: gestaejs.${Part}.${Path}.${[Name]}.${Operation}.${Event}
        // gestaejs.resource.api.company.person.read.before
        // gestaejs.${Part<resource>}.${Path<api.company>}.${[Name<person>]}.${Operation<read>}.${Event<before>}
        // Register all the listeners for this part with the application emitter.
        const _listeners = (this._ModelClass as any).__events ?? [];
        for(const _listener of _listeners) {
            this._applicationContext!.events.on(GestaeEvent.createEventURI(this._path, _listener.register), 
                              _listener.method, _listener.once);
        }
    }

    protected async _initializeChildren(): Promise<void> {
        // Initialize all the child parts.
        for(const _key of Object.keys(this.children)) {
            // Get each child by thier name.
            let _child = this.children[_key];
            await _child.initialize(this._applicationContext!); // Do this sync because there are likely dependencies.
        }
    }

    async initialize(context: IApplicationContext): Promise<void> {
        this._applicationContext = context;
        this._setPath();
        this._registerListeners();
        await this._initializeChildren();
        this._initialized = true;
    }

    async emit<T>(event: GestaeEvent<T>, target?:object): Promise<void> {
        this._applicationContext!.events.emit(event, target);
    }

    protected async emitLifecycle<T>(event: GestaeEvent<T>, operation: string, 
                                     target?:object): Promise<void> {
        event.path = GestaeHttpEvent.createEventURI(this._path, 
            {operation: operation, event: "before"});
        await this._applicationContext!.events.emit(event, target);
        event.path = GestaeHttpEvent.createEventURI(this._path, 
            {operation: operation, event: "on"});
        await this._applicationContext!.events.emit(event, target);
        event.path = GestaeHttpEvent.createEventURI(this._path, 
            {operation: operation, event: "after"});
        await this._applicationContext!.events.emit(event, target);
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        // do nothing
    }

    protected async _done(context: IHttpContext): Promise<void> {
        // do nothing on purpose, just letting implementors know we stopped here.
    }

    async doRequest(context: IHttpContext): Promise<void> {
        let _path = context.request.uri.part; // Take a look at the one we are on

        /* ====================================================================
         * Defensive Coding. 
         * This is protecting on the off chance we REALLY screwed up parsing 
         * the URI. This should never happen, but if it does, we want to catch 
         * it.
         * -------------------------------------------------------------------- */
        if(_path === this.name) 
            await this._doRequest(context); // We are the target, emit our events.
        else throw new NotFoundError(`Path ${_path} not found.`); // We are not the target, but we should be.
        /* ==================================================================== */

        // Check to see if there is more
        if(context.request.uri.hasNext()) {
            _path = context.request.uri.next(); // Move to the next path part

            // Try and find it in our childres.
            const _child = this.children[_path];
            if(!_child) throw new NotFoundError(`Path ${_path} not found.`);
            await _child.doRequest(context); // Recurse into the child.
        }
        else return this._done(context);
    }

    async finalize(context: IApplicationContext): Promise<void> {
        this._initialized = false;
    }

    get initialized(): boolean {
        return this._initialized;
    }

    get parent(): Part | undefined {
        return this._parent;
    }

    addChild(child: Part): Part {
        this.children[child.name] = child;
        child._parent = this;
        return child;
    }
}