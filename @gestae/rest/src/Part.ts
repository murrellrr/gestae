import { IApplicationContext } from "./ApplicationContext";
import { GestaeEvent, Listener, ListenerItem } from "./AsyncEventQueue";
import { NotFoundError } from "./GestaeError";
import { IRequestContext } from "./RequestContext";

export abstract class Part {
    public listeners: ListenerItem[] = [];
    protected parent: Part | undefined;
    public readonly children: Record<string, Part> = {}
    private _initialized: boolean = false

    constructor(public readonly name: string) {
        this.registerListeners();
    }

    private registerListeners() {
        const _listeners = (this.constructor as any).__events ?? [];
        for(const {name, method, once} of _listeners) {
            let _method = (this as any)[method].bind(this);
            this.on(name, _method, once);
        }
    }

    async initialize(context: IApplicationContext): Promise<void> {
        this._initialized = true;
    }

    abstract _do(context: IRequestContext): Promise<boolean>;

    async _done(context: IRequestContext): Promise<void> {
        // do nothing on purpose, just letting implementors know we stopped here.
    }

    async do(context: IRequestContext): Promise<void> {
        let _path = context.request.uri.part; // Take a look at the one we are on
        console.log(`Part: ${this.name} Path: ${_path}`);

        /* ====================================================================
         * Defensive Coding. 
         * This is protecting on the off chance we REALLY screwed up paring the
         * URI. This should never happen, but if it does, we want to catch it.
         * -------------------------------------------------------------------- */
        if(_path === this.name) await this._do(context); // We are the target, emit our events.
        else throw new NotFoundError(`Path ${_path} not found.`); // We are not the target, but we should be.
        /* ==================================================================== */

        // Check to see if there is more
        if(context.request.uri.hasNext()) {
            _path = context.request.uri.next(); // Move to the next path part
            console.log(`Checking for next path ${_path}.`);
            // Try and find it in our childres.
            const _child = this.children[_path];
            if(!_child) throw new NotFoundError(`Path ${_path} not found.`);
            await _child.do(context); // Recurse into the child.
        }
        else await this._done(context);
    }

    async finalize(context: IApplicationContext): Promise<void> {
        this._initialized = false;
    }

    get initialized(): boolean {
        return this._initialized;
    }

    addChild(child: Part): Part {
        this.children[child.name] = child;
        child.parent = this;
        return this;
    }

    /**
     * Register an event listener for a specific event type.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    on(event: string | RegExp, listener: Listener, once: boolean = false) : Part {
        this.listeners.push({event, listener, once: once});
        return this;
    }

    /**
     * Register an event listener that will be called only once.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    once(event: string | RegExp, listener: Listener): Part {
        this.on(event, listener, true);
        return this;
    }

    /**
     * Remove a specific event listener.
     * @param event - The name of the event.
     * @param handler - The handler function to remove.
     */
    off(event: string, listener: (event: GestaeEvent) => void | Promise<void>): Part {
        
        return this;
    }

    /**
     * Remove all listeners for a given event.
     * @param event - The name of the event.
     */
    removeAllListeners(event: string): Part {
        this.listeners.length = 0;
        return this;
    }
}