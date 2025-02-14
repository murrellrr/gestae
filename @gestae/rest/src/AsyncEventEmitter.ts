import { GestaeError } from "./GestaeError";
import { GestaeEvent } from "./GestaeEvent";
import { ILogger } from "./Logger";

//export type Listener<T> = (event: GestaeEvent<T>) => Promise<void>;

export interface ListenerItem {
    event: string | RegExp;
    method: any;
    once: boolean;
}

export interface IAsyncEventQueue {
    on<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void, once?: boolean) : this;
    once<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void): this;
}

export interface IAsyncEventEmitter extends IAsyncEventQueue {
    emit<T>(event: GestaeEvent<T>, target?:object): Promise<void>;
}

export class AsyncEventEmitter implements IAsyncEventEmitter {
    private listeners: ListenerItem[] = [];
    private readonly _logger: ILogger;

    constructor(logger: ILogger) {
        this._logger = logger;
    }

    /**
     * Emit an event and process its handlers sequentially.
     * @param event - The event data.
     */
    async emit<T>(event: GestaeEvent<T>, target?:object): Promise<void> {
        if(this.listeners.length === 0) return;

        const _remaining: ListenerItem[] = [];
        
        for(const _item of this.listeners) {
            if(this.isMatched(_item, event.path)) {
                await this.processListener(_item, event, target);
                if(!_item.once) _remaining.push(_item);
                if(event.cancled) throw GestaeError.toError(event.cause);
            } 
            else _remaining.push(_item);
        }

        // Remove all the once listeners
        this.listeners = _remaining;
    }

    private isMatched(_item: ListenerItem, path: string): boolean {
        return (typeof _item.event === "string") ? _item.event === path : _item.event.test(path);
    }

    private async processListener(_item: ListenerItem, event: GestaeEvent<any>, target?: object): Promise<void> {
        let _method = _item.method;
        if(target) _method = _method.bind(target); // bind the method to the target object if specified.
        await _method(event); // Ensure sequential execution
    }

    /**
     * Register an event listener for a specific event type.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    on<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void, once: boolean = false) : this {
        this.listeners.push({event: event, method: method, once: once});
        return this;
    }

    /**
     * Register an event listener that will be called only once.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    once<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void): this {
        this.on(event, method, true);
        return this;
    }

    /**
     * Remove a specific event listener.
     * @param event - The name of the event.
     * @param handler - The handler function to remove.
     */
    off(event: string, listener: (event: GestaeEvent) => void | Promise<void>): this {
        
        return this;
    }

    /**
     * Remove all listeners for a given event.
     * @param event - The name of the event.
     */
    removeAllListeners(event: string): this {
        this.listeners.length = 0;
        return this;
    }
}