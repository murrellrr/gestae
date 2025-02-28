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
    getClassOptions,
    hasOptionData, 
    IClassOptions, 
    isClassConstructor, 
    setClassOptions 
} from "./Gestae";
import { 
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { AbstractPartFactoryChain, FactoryReturnType } from "./AbstractPartFactoryChain";
import { AbstractPart } from "./Part";
import { IApplicationContext } from "./ApplicationContext";

const RESOURCE_OPTION_KEY = "gestaejs:resource";

/**
 * @description Action types for a resource.
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
 */
export interface IResourceOptions extends IClassOptions {
    name?: string;
    idProperty?: string;
    lazyLoad?: boolean;
    supportedActions?: ResourceAction[];
};

export interface IResource {
    getResourceOptions(): IResourceOptions;
    //getModel(): Model;
    getInstance(... args: [any]): any
}

export const ResourceEvents = defineEvents(
    ["initialize", "revive", "replace", "finalize", "create", "read", "find", "update", "delete", "error"],
    ["before", "on", "after", "error"]
);

export class ResourceEvent<T> extends HttpEvent<T> {
    public readonly resource: IResource;

    constructor(resource: IResource, context: IHttpContext, data: T) {
        super(context, data);
        this.resource = resource;
    }
}

export class ResourcePart extends AbstractPart<IResourceOptions> {
    constructor(target: new (...args: any[]) => any, context: IApplicationContext, options: IResourceOptions = {}) {
        super(target, context, options);
        options.name = options.name ?? target.name.toLowerCase();
        options.idProperty = options.idProperty ?? "id";
        options.lazyLoad = options.lazyLoad ?? true;
        options.supportedActions = options.supportedActions ?? [
            ResourceAction.Create,
            ResourceAction.Read,
            ResourceAction.Update,
            ResourceAction.Delete,
            ResourceAction.Find
        ];
    }

    async _initialize(): Promise<void> {
        //
    }

    async _finalize(): Promise<void> {
        //
    }
}

export class ResourcePartFactory extends AbstractPartFactoryChain<IResourceOptions, ResourcePart> {
    isPartFactory(part: any): boolean {
        return isClassConstructor(part) && hasOptionData(part, RESOURCE_OPTION_KEY);
    }

    _create(part: ClassType): 
            FactoryReturnType<IResourceOptions, ResourcePart> {
        this.log.debug(`Creating resource '${part.name}'`);
        const options: IResourceOptions = getClassOptions(part, RESOURCE_OPTION_KEY);
        options.name = options.name ?? part.name.toLowerCase();
        return {top: new ResourcePart(part, this.context, options)};
    }
}

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 */
export function Resource(options: IResourceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name.toLowerCase();
        setClassOptions(target, RESOURCE_OPTION_KEY, options);
    };
}

export function OnResourceEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnAsyncResourceEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ResourceEvent<I>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}