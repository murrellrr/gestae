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
    ClassType,
    defineEvents,
    EventRegisterType,
    getsertMetadata,
    hasMetadata,
    IOptions, 
    isClassConstructor,
    setMetadata
} from "./Gestae";
import { 
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { AbstractPartFactoryChain, FactoryReturnType } from "./AbstractPartFactoryChain";
import { Template } from "./Template";
import { AbstractTaskablePart } from "./Task";

const RESOURCE_OPTION_KEY = "gestaejs:resource";

/**
 * @description Action types for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export enum ResourceAction {
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete",
    Find = "find",
}

/**
 * @description Options for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceOptions extends IOptions {
    name?: string;
    idProperty?: string;
    lazyLoad?: boolean;
    supportedActions?: ResourceAction[];
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResource {
    getResourceOptions(): IResourceOptions;
    //getModel(): Model;
    getInstance(... args: [any]): any
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const ResourceEvents = defineEvents(
    ["initialize", "revive", "replace", "finalize", "create", "read", "find", "update", "delete", "error"],
    ["before", "on", "after", "error"]
);

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceEvent<T> extends HttpEvent<T> {
    public readonly resource: IResource;

    constructor(resource: IResource, context: IHttpContext, data: T) {
        super(context, data);
        this.resource = resource;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourcePart extends AbstractTaskablePart<IResourceOptions> {
    public readonly model: ClassType;

    constructor(target: ClassType, options: IResourceOptions = {}) {
        super(options);
        this.model = target;
        options.name = options.name?.toLowerCase() ?? target.name.toLowerCase();
        options.idProperty = options.idProperty ?? "id";
        options.lazyLoad = options.lazyLoad ?? true;
        options.supportedActions = options.supportedActions ?? [
            ResourceAction.Create,
            ResourceAction.Read,
            ResourceAction.Update,
            ResourceAction.Delete,
            ResourceAction.Find
        ];
        options.$overloads = options.$overloads ?? true;
    }

    get type(): string {
        return "resource";
    }

    getInstance<T extends Object>(...args: any[]): T {
        return new this.model(...args) as T;
    }

    static create(aClass: ClassType, options: IResourceOptions = {}): ResourcePart {
        return new ResourcePart(aClass, getsertMetadata(aClass, RESOURCE_OPTION_KEY, options));
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourcePartFactory extends AbstractPartFactoryChain<IResourceOptions, ResourcePart> {
    isPartFactory(target: Template): boolean {
        return isClassConstructor(target.base) && hasMetadata(target.base, RESOURCE_OPTION_KEY);
    }

    _create(target: Template): FactoryReturnType<IResourceOptions, ResourcePart> {
        this.log.debug(`Creating resource '${target.name}'`);
        return {top: ResourcePart.create((target.base as ClassType))};
    }
}

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function Resource(options: IResourceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name;
        options.idProperty = options.idProperty ?? "id";
        options.lazyLoad = options.lazyLoad ?? true;
        options.supportedActions = options.supportedActions ?? [
            ResourceAction.Create,
            ResourceAction.Read,
            ResourceAction.Update,
            ResourceAction.Delete,
            ResourceAction.Find
        ];
        options.$overloads = options.$overloads ?? true;
        setMetadata(target, RESOURCE_OPTION_KEY, options);
    };
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnResourceEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncResourceEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}