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
    HttpMethodEnum,
    getsertMetadata,
    hasMetadata,
    isClassConstructor,
} from "./Gestae";
import { 
    EventRegisterType,
    formatEvent,
} from "./GestaeEvent";
import { 
    HttpContext 
} from "./HttpContext";
import { 
    AbstractNodeFactoryChain, 
    FactoryReturnType 
} from "./AbstractNodeFactoryChain";
import { NodeTemplate } from "./NodeTemplate";
import { 
    BadRequestError, 
    MethodNotAllowedError 
} from "./GestaeError";
import { 
    IResourceNode,
    ResourceEvent, 
    ResourceEvents,
} from "./ResourceEvent";
import { 
    ResourceActionEnum, 
    RESOURCE_METADATA_KEY, 
    IResourceOptions
} from "./Resource";
import { AbstractTaskableNode } from "./TaskNode";
import { HttpRequest } from "./HttpRequest";

interface IResourceContext {
    id?:            string;
    instance:       any;
    action:         ResourceActionEnum;
    event:          ResourceEvent<any>;
    overrideEvent?: ResourceEvent<any>;
    doBeforeEvents: EventRegisterType[];
    doAfterEvents:  EventRegisterType[];
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNode extends AbstractTaskableNode<IResourceOptions> implements IResourceNode {
    protected readonly idProperty:       string;
    protected readonly lazyLoad:         boolean;
    protected readonly supportedActions: ResourceActionEnum[];
    protected readonly resourceId:       string | undefined;
    public    readonly model:            ClassType;

    constructor(target: ClassType, options: IResourceOptions = {}) {
        super(options);
        this.model = target;
        options.name = options.name?.toLowerCase() ?? target.name.toLowerCase();
        this.idProperty = options.idProperty ?? "id";
        this.lazyLoad   = options.lazyLoad ?? true;
        this.resourceId = options.resourceId;
        this.supportedActions = options.supportedActions ?? [
            ResourceActionEnum.Create,
            ResourceActionEnum.Read,
            ResourceActionEnum.Update,
            ResourceActionEnum.Delete
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
        return this.resourceId ?? this.model.name;
    }

    getResourceOptions(): IResourceOptions {
        return this.options;
    }

    getSupportedAction(method: string, id?:string, target?: boolean): ResourceActionEnum {
        let _action: ResourceActionEnum | undefined = undefined;

        switch(method) {
            case HttpMethodEnum.Get: 
                _action = (id)? ResourceActionEnum.Read : undefined;
                break;
            case HttpMethodEnum.Patch:
            case HttpMethodEnum.Put: 
                _action =  (target)? ResourceActionEnum.Update : ResourceActionEnum.Read;
                break;
            case HttpMethodEnum.Post:
                _action =  (target)? ResourceActionEnum.Create : ResourceActionEnum.Read;
                break;
            case HttpMethodEnum.Delete: 
                _action =  ResourceActionEnum.Delete;
        }

        if(!_action || !this.supportedActions.includes(_action))
            throw new MethodNotAllowedError(`Method '${method}' is not supported on resource '${this.name}'.`);
        return _action;
    }

    getInstance<T extends Object>(...args: any[]): T {
        return new this.model(...args) as T;
    }

    createInstance<T extends Object>(id?: string): T {
        const _instance = this.getInstance<T>();
        if(id) (_instance as any)[this.options.idProperty!] = id;
        return _instance;
    }

    public async emitResourceEvent(context: HttpContext, event: ResourceEvent<any>, type: EventRegisterType): Promise<void> {
        event.data = context.resources.getResource(this.resourceKey);
        event.path = `${this.fullyQualifiedPath}:${formatEvent(type)}`;
        await this.emitEvent(context, event);
        context.resources.setResource(this.resourceKey, event.data);
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        const _id     = context.request.uri.next;
        const _action = this.getSupportedAction(context.request.method, _id, 
                                                context.request.uri.target);
        
        // Validate whether the ID is required or not..
        if((_action !== ResourceActionEnum.Create) && !_id)
            throw new BadRequestError(`Id required for '${_action}' actions on entity '${this.name}'.`);

        const _resource = {
            id:             _id,
            instance:       this.createInstance(_id),
            action:         _action,
            event:          new ResourceEvent(context, this),
            doBeforeEvents: [],
            doAfterEvents:  []
        } as IResourceContext;
        context.setValue(this.resourceKey, _resource);
        context.resources.setResource(this.resourceKey, _resource.instance);

        this.prepareEvents(_resource, context._request);
        await this.prepareBody(_resource, context);
    }

    protected async prepareBody(resource: IResourceContext, context: HttpContext): Promise<void> {
        if(resource.action === ResourceActionEnum.Create || 
                resource.action === ResourceActionEnum.Update || 
                resource.action === ResourceActionEnum.Delete) {
            // Update the body and reset into the resource and events.
            resource.instance   = await context.request.mergeBody(resource.instance);
            resource.event.data = resource.instance;
            context.resources.setResource(this.resourceKey, resource.instance);
        }
    }

    protected prepareEvents(resource: IResourceContext, request: HttpRequest): void {
        switch(resource.action) {
            case ResourceActionEnum.Create:
                resource.doBeforeEvents.push(ResourceEvents.Create.OnBefore);
                resource.doBeforeEvents.push(ResourceEvents.Create.On);
                resource.doAfterEvents.push(ResourceEvents.Create.OnAfter);
                break;
            case ResourceActionEnum.Read:
                resource.doBeforeEvents.push(ResourceEvents.Read.OnBefore);
                resource.doBeforeEvents.push(ResourceEvents.Read.On);
                break;
            case ResourceActionEnum.Update:
                resource.doBeforeEvents.push(ResourceEvents.Update.OnBefore);
                resource.doBeforeEvents.push(ResourceEvents.Update.On);
                resource.doAfterEvents.push(ResourceEvents.Update.OnAfter);
                break;
            case ResourceActionEnum.Delete:
                resource.doBeforeEvents.push(ResourceEvents.Delete.OnBefore);
                resource.doBeforeEvents.push(ResourceEvents.Delete.On);
                resource.doAfterEvents.push(ResourceEvents.Delete.OnAfter);
                break;
            default: 
                throw new MethodNotAllowedError(`Resource '${this.name}' does not support action '${resource.action}'`);
        }

        resource.doBeforeEvents.unshift(ResourceEvents.Resource.On);
        resource.doBeforeEvents.unshift(ResourceEvents.Resource.OnBefore);
        resource.doAfterEvents.push(ResourceEvents.Resource.OnAfter);
    }

    protected async loopEvents(context: HttpContext, event: ResourceEvent<any>, actions: EventRegisterType[]): Promise<void> {
        // Perform the before events.
        for(const _action of actions) {
            await this.emitResourceEvent(context, event, _action);
        }
    }

    public async onRequest(context: HttpContext): Promise<void> {
        const _resource = context.getValue<IResourceContext>(this.resourceKey);
        // Perform the before events.
        await this.loopEvents(context, _resource.event, _resource.doBeforeEvents);
        context.response.send(_resource.instance);
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        const _resource = context.getValue<IResourceContext>(this.resourceKey);
        // Perform the before events.
        await this.loopEvents(context, _resource.event, _resource.doAfterEvents);
    }

    static create(aClass: ClassType, options: IResourceOptions = {}): ResourceNode {
        return new ResourceNode(aClass, getsertMetadata(aClass, RESOURCE_METADATA_KEY, options));
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNodeFactory extends AbstractNodeFactoryChain<IResourceOptions, ResourceNode> {
    isNodeFactory(target: NodeTemplate): boolean {
        return isClassConstructor(target.node) && hasMetadata(target.node, RESOURCE_METADATA_KEY);
    }

    onCreate(target: NodeTemplate): FactoryReturnType<IResourceOptions, ResourceNode> {
        return {top: ResourceNode.create((target.node as ClassType))};
    }
}
