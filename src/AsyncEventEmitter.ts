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

import { IAsyncEventQueue } from "./AsyncEventQueue";
import { GestaeError } from "./GestaeError";
import { GestaeEvent } from "./GestaeEvent";
import { ILogger } from "./Logger";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ListenerItem {
    event: string | RegExp;
    method: any;
    once: boolean;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IAsyncEventEmitter {
    emit<T>(event: GestaeEvent<T>, target?:object): Promise<void>;
    clear(): void;
}
/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class AsyncEventEmitter implements IAsyncEventEmitter, IAsyncEventQueue {
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
            if(this._isMatched(_item, event.path)) {
                await this._processListener(_item, event, target);
                if(!_item.once) _remaining.push(_item);
                if(event.cancled) throw GestaeError.toError(event.cause);
            } 
            else _remaining.push(_item);
        }

        // Remove all the once listeners
        this.listeners = _remaining;
    }

    private _isMatched(_item: ListenerItem, path: string): boolean {
        return (typeof _item.event === "string") ? _item.event === path : _item.event.test(path);
    }

    private async _processListener(_item: ListenerItem, event: GestaeEvent<any>, target?: object): Promise<void> {
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
    off<T, E extends GestaeEvent<T>>(event: string, listener: (event: E) => Promise<void> | void): this {
        
        return this;
    }

    /**
     * Remove all listeners for a given event.
     * @param event - The name of the event.
     */
    clear(): this {
        this.listeners.length = 0;
        return this;
    }
}