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

import { 
    createEventPathFromNode,
    createEventRegister,
    EventRegisterType,
    IEventOptions, 
    setEventMetadata 
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { HttpEvent } from "./HttpEvent";
import { 
    IResourceNode,
    ResourceActionEnum
} from "./Resource";
import { IResource } from "./ResourceManager";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const ResourceEvents = {
    before: "before" as string,
    on:     "on" as string,
    after:  "after" as string,
    Resource: {
        opertaion: "resource" as string,
        OnBefore: {operation: "resource", action: "before"} as EventRegisterType,
        On:       {operation: "resource", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "resource", action: "after" } as EventRegisterType,
    },
    Create: {
        opertaion: "create" as string,
        OnBefore: {operation: "create", action: "before"} as EventRegisterType,
        On:       {operation: "create", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "create", action: "after" } as EventRegisterType,
    },
    Read: {
        opertaion: "read" as string,
        OnBefore: {operation: "read", action: "before"} as EventRegisterType,
        On:       {operation: "read", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "read", action: "after" } as EventRegisterType,
    },
    Search: {
        opertaion: "search" as string,
        OnBefore: {operation: "search", action: "before"} as EventRegisterType,
        On:       {operation: "search", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "search", action: "after" } as EventRegisterType,
    },
    MediaSearch: {
        opertaion: "mediaSearch" as string,
        OnBefore: {operation: "mediasearch", action: "before"} as EventRegisterType,
        On:       {operation: "mediasearch", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "mediasearch", action: "after" } as EventRegisterType,
    },
    Update: {
        opertaion: "update" as string,
        OnBefore: {operation: "update", action: "before"} as EventRegisterType,
        On:       {operation: "update", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "update", action: "after" } as EventRegisterType,
    },
    Delete: {
        opertaion: "delete" as string,
        OnBefore: {operation: "delete", action: "before"} as EventRegisterType,
        On:       {operation: "delete", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "delete", action: "after" } as EventRegisterType,
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceEvent extends HttpEvent<IResource> {
    public readonly resource: IResourceNode;
    public readonly action:   ResourceActionEnum;
    constructor(context: IHttpContext, resource: IResourceNode, action: ResourceActionEnum, 
                event: string, data: IResource, path?: string) {
        super(context, data, path);
        this.action   = action;
        this.resource = resource;
        this.path     = createEventPathFromNode(resource, 
                            createEventRegister(action, event));
    }
}

export class IDResourceEvent extends ResourceEvent {
    public readonly id: string;
    constructor(context: IHttpContext, resource: IResourceNode, action: ResourceActionEnum, 
                event: string, data: IResource, id: string, path?: string) {
        super(context, resource, action, event, data, path);
        this.id = id;
    }
}

export class CreateResourceEvent extends ResourceEvent {
    constructor(context: IHttpContext, resource: IResourceNode, event: string, 
                data: IResource, path?: string) {
        super(context, resource, ResourceActionEnum.Create, event, data, path);
    }
}

export class ReadResourceEvent extends IDResourceEvent {
    constructor(context: IHttpContext, resource: IResourceNode, event: string,  
                id: string, data: IResource) {
        super(context, resource, ResourceActionEnum.Update, event, data, id);
    }
}

export class UpdateResourceEvent extends IDResourceEvent {
    public readonly patch: boolean;
    constructor(context: IHttpContext, resource: IResourceNode, event: string,  
                id: string, data: IResource, patch: boolean = false) {
        super(context, resource, ResourceActionEnum.Update, event, data, id);
        this.patch = patch;
    }
}

export class DeleteResourceEvent extends IDResourceEvent {
    constructor(context: IHttpContext, resource: IResourceNode, event: string,  
                id: string, data: IResource) {
        super(context, resource, ResourceActionEnum.Delete, event, data, id);
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnResourceEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent) => Promise<void>>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.
