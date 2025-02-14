import { IApplicationContext } from "./ApplicationContext";
import { ListenerItem } from "./AsyncEventEmitter";
import { NotFoundError } from "./GestaeError";
import { GestaeEvent } from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { Model } from "./Model";

export abstract class Part {
    private _initialized: boolean = false;
    private readonly _model: Model;
    protected _parent: Part | undefined;
    protected _path: string;
    public listeners: ListenerItem[] = [];
    public readonly children: Record<string, Part> = {};

    constructor(model: Model) {
        this._model = model;
        // this.name = name.toLowerCase();
        this._path = this._model.id;
        // // Update any decorated event listeners to have a name and bound to this instance.
        const _listeners = (this._model.constructor as any).__events ?? [];
        for(const _listener of _listeners) {
            _listener.method = (this._model as any)[_listener.method].bind(this._model);
            _listener.once = _listener.once ?? false;
        }
    }

    protected abstract get type(): string;

    get path(): string {
        return this._path;
    }

    get name() {
        return this._model.id;
    }

    get model(): Model {
        return this._model;
    }

    async initialize(context: IApplicationContext): Promise<void> {
        // Setting up this part URI.
        let _parent = this._parent;
        while(_parent) {
            this._path = `${_parent.name}.${this._path}`;
            _parent = _parent._parent;
        }
        this._path = `gestaejs.${this.type}.${this._path}`;

        // Example full event path: gestaejs.${Part}.${Path}.${[Name]}.${Operation}.${Event}
        // gestaejs.resource.api.company.person.read.before
        // gestaejs.${Part<resource>}.${Path<api.company>}.${[Name<person>]}.${Operation<read>}.${Event<before>}
        // Register all the listeners for this part with the application emitter.
        const _listeners = (this._model.constructor as any).__events ?? [];
        for(const _listener of _listeners) {
            context.events.on(GestaeEvent.createEventURI(this._path, _listener.register), 
                              _listener.method, _listener.once);
        }

        // Initialize all the child parts.
        for(const _key of Object.keys(this.children)) {
            // Get each child by thier name.
            let _child = this.children[_key];
            await _child.initialize(context); // Do this sync because there my be expected dependancies.
        }

        this._initialized = true;
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
         * This is protecting on the off chance we REALLY screwed up paring the
         * URI. This should never happen, but if it does, we want to catch it.
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