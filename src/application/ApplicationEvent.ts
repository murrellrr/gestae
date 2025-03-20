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

import { IApplicationContext } from "./IApplicationContext";
import { EventRegisterType, GestaeEvent } from "../events/GestaeEvent";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const ApplicationEvents = {
    Initialize: {
        OnBefore: {operation: "initialize", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "initialize", action: "after" } as EventRegisterType,
    },
    Start: {
        OnBefore: {operation: "start", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "start", action: "after" } as EventRegisterType,
    },
    Stop: {
        OnBefore: {operation: "stop", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "stop", action: "after" } as EventRegisterType,
    },
    Finalize: {
        OnBefore: {operation: "finalize", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "finalize", action: "after" } as EventRegisterType,
    },
    Error: {
        OnBefore: {operation: "error", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "error", action: "after" } as EventRegisterType,
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ApplicationEvent<T = {}> extends GestaeEvent<T> {
    public readonly context: IApplicationContext;

    constructor(context: IApplicationContext, data: T, path?: string) {
        super(data, path);
        this.context = context;
    }
}