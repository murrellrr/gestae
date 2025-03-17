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

import { GestaeEvent } from "./GestaeEvent";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IAsyncEventQueue {
    /**
     * @description Emit an event to all listeners.
     * @param event           The event to listen for.
     * @param listener        The listener to call when the event is emitted.
     * @param once            If true, the listener will only be called once.
     * @param useDataAsTarget If true, the event data will be used as the target of the method invoked. 
     *                        This allows for the use of 'this' and maintaining reference to other 
     *                        properties of the target method.
     * @returns               The event queue to daisychain calls.
     */
    on<T, E extends GestaeEvent<T>>(event: string | RegExp, listener: (event: E) => Promise<void> | void, 
                                    once?: boolean, useDataAsTarget?: boolean) : IAsyncEventQueue;
    once<T, E extends GestaeEvent<T>>(event: string | RegExp, listener: (event: E) => Promise<void> | void, 
                                      useDataAsTarget?: boolean): IAsyncEventQueue;
    off<T, E extends GestaeEvent<T>>(event: string, listener: (event: E) => Promise<void> | void): IAsyncEventQueue;
}