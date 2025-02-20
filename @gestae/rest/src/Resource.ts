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

import "reflect-metadata";
import { HttpEvent } from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { 
    IEventRegister,
    IResourceOptions,
    validateAndSetTypedEventMetaData  
} from "./Gestae";


const RESOURCE_ID  = "id";

export type Model = new (...args: any[]) => any;

export enum ResourceMethod {
    Create = "create",
    Read = "read",
    Find = "find",
    Update = "update",
    Delete = "delete",
}

export const ResourceEvents = {
    Create: {
        OnBefore: {operation: "create", action: "before"},
        On: {operation: "create", action: "on"},
        OnAfter: {operation: "create", action: "after"},
        OnError: {operation: "create", action: "error"}
    },
    Read: {
        OnBefore: {operation: "read", action: "before"},
        On: {operation: "read", action: "on"},
        OnAfter: {operation: "read", action: "after"}
    },
    Find: {
        OnBefore: {operation: "find", action: "before"},
        On: {operation: "find", action: "on"},
        OnAfter: {operation: "find", action: "after"},
        OnError: {operation: "find", action: "error"}
    },
    Update: {
        OnBefore: {operation: "update", action: "before"},
        On: {operation: "update", action: "on"},
        OnAfter: {operation: "update", action: "after"},
        OnError: {operation: "update", action: "error"}
    },
    Delete: {
        OnBefore: {operation: "delete", action: "before"},
        On: {operation: "delete", action: "on"},
        OnAfter: {operation: "delete", action: "after"},
        OnError: {operation: "delete", action: "error"}
    },
    Error: {
        On: {operation: "error", action: "on"}
    }
};



export interface IResource {
    getResourceOptions(): IResourceOptions;
    getModel(): Model;
    getInstance(... args: [any]): any
}

export class ResourceEvent<T> extends HttpEvent<T> {
    public readonly resource: IResource;

    constructor(resource: IResource, context: IHttpContext, data: T) {
        super(context, data);
        this.resource = resource;
    }
}

// export class ResourcePart extends AbstractPart implements IResource {
//     protected readonly model: Model;

//     constructor(model: Model, options: IResourceOptions = {}) {
//         super(options);
//         this.model = model;
//         // Setting up the default options.
//         options.idProperty = options?.idProperty ?? RESOURCE_ID;
//         options.useSchemaAsDefaults = options?.useSchemaAsDefaults ?? false;
//         options.lazyLoad = options?.lazyLoad ?? false;
//         options.allowedMethods = options?.allowedMethods ?? [];
//     }

//     getInstance(... args: [any]): any {
//         return new this.model(...args);
//     }

//     getResourceOptions(): IResourceOptions {
//         return this.options as IResourceOptions;
//     }

//     getModel(): Model {
//         return this.model;
//     }

//     async _doRequest(): Promise<void> {
//         //
//     }

//     static create(model: Model, options: IResourceOptions = {}): ResourcePart {
//         return new ResourcePart(model, options);
//     }
// }

export function OnResourceEvent<I>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                        descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => void>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}

export function OnAsyncResourceEvent<I>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                        descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => Promise<void>>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}