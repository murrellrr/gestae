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
    EventRegisterType,
    getsertMetadata,
    hasMetadata,
    isClassConstructor,
} from "./Gestae";
import { 
    formatEvent,
} from "./GestaeEvent";
import { 
    HttpMethodEnum, 
    IHttpContext 
} from "./HttpContext";
import { 
    AbstractNodeFactoryChain, 
    FactoryReturnType 
} from "./AbstractNodeFactoryChain";
import { NodeTemplate } from "./NodeTemplate";
import { AbstractTaskableNode } from "./TaskNode";
import { 
    BadRequestError, 
    MethodNotAllowedError 
} from "./GestaeError";
import { 
    IResourceNode,
    ResourceEvent, 
    ResourceEvents 
} from "./ResourceEvent";
import { 
    ResourceActionEnum, 
    RESOURCE_OPTION_KEY, 
    IResourceOptions 
} from "./Resource";

interface IResourceContext {
    id?:      string;
    instance: any;
    action:   ResourceActionEnum;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNode extends AbstractTaskableNode<IResourceOptions> implements IResourceNode {
    public readonly model: ClassType;

    constructor(target: ClassType, options: IResourceOptions = {}) {
        super(options);
        this.model = target;
        options.name = options.name?.toLowerCase() ?? target.name.toLowerCase();
        options.idProperty = options.idProperty ?? "id";
        options.lazyLoad = options.lazyLoad ?? true;
        options.supportedActions = options.supportedActions ?? [
            ResourceActionEnum.Create,
            ResourceActionEnum.Read,
            ResourceActionEnum.Update,
            ResourceActionEnum.Delete,
            ResourceActionEnum.Search
        ];
        options.$overloads = options.$overloads ?? true;
    }

    get type(): string {
        return "resource";
    }

    get endpoint(): boolean {
        return true;
    }

    get resourceKey(): string {
        return this.options.resourceId ?? this.model.name;
    }

    getResourceOptions(): IResourceOptions {
        return this.options;
    }

    getAction(method: string, id?:string, target?: boolean): ResourceActionEnum {
        switch(method) {
            case HttpMethodEnum.GET: 
                return (id)? ResourceActionEnum.Read : ResourceActionEnum.Search;
            case HttpMethodEnum.PATCH:
            case HttpMethodEnum.PUT: 
                return (target)? ResourceActionEnum.Update : ResourceActionEnum.Read;
            case HttpMethodEnum.POST:
                return (target)? ResourceActionEnum.Create : ResourceActionEnum.Read;
            case HttpMethodEnum.DELETE: 
                return ResourceActionEnum.Delete;
            default: 
                return ResourceActionEnum.Create;
        }
    }

    supportsAction(action: ResourceActionEnum): boolean {
        return this.options.supportedActions!.includes(action) ?? false;
    }

    getInstance<T extends Object>(...args: any[]): T {
        return new this.model(...args) as T;
    }

    createInstance<T extends Object>(id: string): T {
        const _instance = this.getInstance<T>();
        (_instance as any)[this.options.idProperty!] = id;
        return _instance;
    }

    protected async _emitEvent(context: IHttpContext, event: ResourceEvent<any>, type: EventRegisterType): Promise<void> {
        event.data = context.resources.getResource(this.resourceKey);
        event.path = `${this.fullyQualifiedPath}:${formatEvent(type)}`;
        context.log.debug(`Emitting event '${event.path}'.`);
        await this.emitEvent(context, event);
        context.resources.setResource(this.resourceKey, event.data);
    }

    protected async _beforeDoRequest(context: IHttpContext): Promise<void> {
        const _id       = context.request.uri.hasNext? context.request.uri.next : undefined;
        const _resource = {
            id:     _id,
            action: this.getAction(context.request.method, _id, context.request.uri.target)
        } as IResourceContext;
        context.setValue(this.resourceKey, _resource);

        if(this.supportsAction(_resource.action)) {
            // If its not a 'find' or a 'create' it MUST have an id.
            if((_resource.action !== ResourceActionEnum.Search && 
                    _resource.action !== ResourceActionEnum.Create) && !_id)
                throw new BadRequestError(`Id required for '${_resource.action}' actions on entity '${this.name}'.`);

            context.log.debug(`Processing resource '${this.name}' with ID '${_id ?? ''}' using action '${_resource.action}'`);
            context.resources.setResource(this.resourceKey, (_id)? 
                this.createInstance(_id) : this.getInstance());
            const _event = new ResourceEvent(context, this);

            await this._emitEvent(context, _event, ResourceEvents.Process.OnBefore);
        }
        else 
            throw new MethodNotAllowedError(`Resource '${this.name}' does not support action '${_resource.action}'`);
    }

    protected async _performBeginActions(context: IHttpContext, resource: IResourceContext, 
                                        action: ResourceActionEnum): Promise<void> {
        // Perform OnBegin
        switch(action) {
            case ResourceActionEnum.Create:
            case ResourceActionEnum.Read:
            case ResourceActionEnum.Update:
            case ResourceActionEnum.Delete:
            case ResourceActionEnum.Search:
                break;
        }
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        const _event = new ResourceEvent(context, this);
        await this._emitEvent(context, _event, ResourceEvents.Process.On);

        // Check to see which mode this is:
        const _resource = context.getValue<IResourceContext>(this.resourceKey);
        return this._performBeginActions(context, _resource, _resource.action);
    }

    protected async _afterDoRequest(context: IHttpContext): Promise<void> {
        // Perform OnAfter<Action>
        const _event = new ResourceEvent(context, this);
        await this._emitEvent(context, _event, ResourceEvents.Process.OnAfter);
    }

    static create(aClass: ClassType, options: IResourceOptions = {}): ResourceNode {
        return new ResourceNode(aClass, getsertMetadata(aClass, RESOURCE_OPTION_KEY, options));
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNodeFactory extends AbstractNodeFactoryChain<IResourceOptions, ResourceNode> {
    isNodeFactory(target: NodeTemplate): boolean {
        return isClassConstructor(target.node) && hasMetadata(target.node, RESOURCE_OPTION_KEY);
    }

    _create(target: NodeTemplate): FactoryReturnType<IResourceOptions, ResourceNode> {
        this.log.debug(`Creating resource '${target.name}'`);
        return {top: ResourceNode.create((target.node as ClassType))};
    }
}

