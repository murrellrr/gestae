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

import { IAsyncEventQueue } from "./IAsyncEventQueue";
import { GestaeError } from "../error/GestaeError";
import { GestaeEvent } from "./GestaeEvent";
import { ILogger } from "../log/ILogger";
import { IAsyncEventEmitter } from "./IAsyncEventEmitter";
import { IListenerItem } from "./IListenerItem";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class AsyncEventEmitter implements IAsyncEventEmitter, IAsyncEventQueue {
    private          listeners: IListenerItem[] = [];
    private readonly log:       ILogger;

    constructor(logger: ILogger) {
        this.log = logger;
    }

    /**
     * Emit an event and process its handlers sequentially.
     * @param event - The event data.
     */
    async emit<T>(event: GestaeEvent<T>, target?: object): Promise<void> {
        if(this.listeners.length === 0) return;

        const _remaining: IListenerItem[] = [];
        
        for(const _item of this.listeners) {
            if(this._isMatched(_item, event.path)) {
                let _target = target;
                if(!_target && _item.useDataAsTarget) _target = event.data!;
                await this._processListener(_item, event, _target);
                if(!_item.once) _remaining.push(_item);
                if(event.cancled) throw GestaeError.toError(event.cause);
            } 
            else _remaining.push(_item);
        }

        // Remove all the once listeners
        this.listeners = _remaining;
    }

    private _isMatched(_item: IListenerItem, path: string): boolean {
        return (typeof _item.event === "string") ? _item.event === path : _item.event.test(path);
    }

    private async _processListener(_item: IListenerItem, event: GestaeEvent<any>, target?: object): Promise<void> {
        if(target) _item.method.call(target, event); // bind the method to the target object if specified.
        await _item.method(event);
    }

    /**
     * Register an event listener for a specific event type.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    on<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void, once: boolean = false, 
                                    useDataAsTarget: boolean = false) : this {
        this.listeners.push({event: event, method: method, once: once, useDataAsTarget: useDataAsTarget});
        return this;
    }

    /**
     * Register an event listener that will be called only once.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    once<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void, 
                                      useDataAsTarget: boolean = false): this {
        this.on(event, method, true, useDataAsTarget);
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