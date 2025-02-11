import { IApplicationContext } from "./ApplicationContext";
import { ListenerItem } from "./AsyncEventEmitter";
import { NotFoundError } from "./GestaeError";
import { IRequestContext } from "./RequestContext";

export abstract class Part {
    private _initialized: boolean = false;
    protected parent: Part | undefined;
    public readonly name: string;
    public listeners: ListenerItem[] = [];
    public readonly children: Record<string, Part> = {};
    

    constructor(name: string) {
        this.name = name.toLowerCase();
        // Update any decorated event listeners to have a name and bound to this instance.
        const _listeners = (this.constructor as any).__events ?? [];
        for(const _listener of _listeners) {
            if(typeof _listener.method === "string")
                _listener.method = (this as any)[_listener.method].bind(this);
            else
                _listener.method = _listener.method.bind(this);
            _listener.once = _listener.once ?? false;
        }
    }

    async initialize(context: IApplicationContext): Promise<void> {
        // Do the things I need to do to register my listerns with the application events.

        // Initialize all the child parts.
        for(const _key of Object.keys(this.children)) {
            // Get each child by thier name.
            let _child = this.children[_key];
            await _child.initialize(context); // Do this sync because there my be expected dependancies.
        }

        this._initialized = true;
    }

    abstract _do(context: IRequestContext): Promise<boolean>;

    async _done(context: IRequestContext): Promise<void> {
        // do nothing on purpose, just letting implementors know we stopped here.
    }

    async do(context: IRequestContext): Promise<void> {
        let _path = context.request.uri.part; // Take a look at the one we are on

        context.logger.debug(`Processing part '${this.name}' for path '${_path}'.`);

        /* ====================================================================
         * Defensive Coding. 
         * This is protecting on the off chance we REALLY screwed up paring the
         * URI. This should never happen, but if it does, we want to catch it.
         * -------------------------------------------------------------------- */
        if(_path === this.name) 
            await this._do(context); // We are the target, emit our events.
        else throw new NotFoundError(`Path ${_path} not found.`); // We are not the target, but we should be.
        /* ==================================================================== */

        // Check to see if there is more
        if(context.request.uri.hasNext()) {
            _path = context.request.uri.next(); // Move to the next path part
            
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
        return child;
    }

    // /**
    //  * Register an event listener for a specific event type.
    //  * @param event - The name of the event.
    //  * @param handler - The async function to handle the event.
    //  */
    // on(event: string | RegExp, listener: Listener, once: boolean = false) : this {
    //     this.listeners.push({event, listener, once: once});
    //     return this;
    // }

    // /**
    //  * Register an event listener that will be called only once.
    //  * @param event - The name of the event.
    //  * @param handler - The async function to handle the event.
    //  */
    // once(event: string | RegExp, listener: Listener): this {
    //     this.on(event, listener, true);
    //     return this;
    // }

    // /**
    //  * Remove a specific event listener.
    //  * @param event - The name of the event.
    //  * @param handler - The handler function to remove.
    //  */
    // off(event: string, listener: (event: GestaeEvent) => void | Promise<void>): this {
        
    //     return this;
    // }

    // /**
    //  * Remove all listeners for a given event.
    //  * @param event - The name of the event.
    //  */
    // removeAllListeners(event: string): this {
    //     this.listeners.length = 0;
    //     return this;
    // }
}