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

import { INode } from "./Node";
import { 
    EventRegisterType,
    HttpEvent, 
    IEventOptions, 
    setEventMetadata 
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { 
    IResourceOptions,
} from "./Resource";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const ResourceEvents = {
    Resource: {
        OnBefore: {operation: "resource", action: "before"} as EventRegisterType,
        On:       {operation: "resource", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "resource", action: "after" } as EventRegisterType,
    },
    Create: {
        OnBefore: {operation: "create", action: "before"} as EventRegisterType,
        On:       {operation: "create", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "create", action: "after" } as EventRegisterType,
    },
    Traverse: {
        OnBefore: {operation: "traverse", action: "before"} as EventRegisterType,
        On:       {operation: "traverse", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "traverse", action: "after" } as EventRegisterType,
    },
    Read: {
        OnBefore: {operation: "read", action: "before"} as EventRegisterType,
        On:       {operation: "read", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "read", action: "after" } as EventRegisterType,
    },
    Search: {
        OnBefore: {operation: "search", action: "before"} as EventRegisterType,
        On:       {operation: "search", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "search", action: "after" } as EventRegisterType,
    },
    MediaSearch: {
        OnBefore: {operation: "mediasearch", action: "before"} as EventRegisterType,
        On:       {operation: "mediasearch", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "mediasearch", action: "after" } as EventRegisterType,
    },
    Update: {
        OnBefore: {operation: "update", action: "before"} as EventRegisterType,
        On:       {operation: "update", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "update", action: "after" } as EventRegisterType,
    },
    Delete: {
        OnBefore: {operation: "delete", action: "before"} as EventRegisterType,
        On:       {operation: "delete", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "delete", action: "after" } as EventRegisterType,
    },
    Error: {
        OnBefore: {operation: "error", action: "before"} as EventRegisterType,
        On:       {operation: "error", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "error", action: "after" } as EventRegisterType,
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceNode extends INode {
    get resourceKey(): string;
    getResourceOptions(): IResourceOptions;
    getInstance<T extends Object>(... args: [any]): T;
    createInstance<T extends Object>(id: string): T
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceEvent<T> extends HttpEvent<T> {
    public readonly resource: IResourceNode;
    constructor(context: IHttpContext, resource: IResourceNode, data?: T) {
        super(context, data);
        this.resource = resource;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnResourceEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => void>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncResourceEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => Promise<void>>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.