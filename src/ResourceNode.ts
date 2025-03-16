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
    GestaeClassType,
    GestaeObjectType,
    HttpMethodEnum,
    getsertClassMetadata,
    hasClassMetadata,
    isClassConstructor,
} from "./Gestae";
import { EventRegisterType} from "./GestaeEvent";
import { HttpContext, IHttpContext } from "./HttpContext";
import { 
    AbstractNodeFactoryChain, 
    FactoryReturnType 
} from "./AbstractNodeFactoryChain";
import { NodeTemplate } from "./NodeTemplate";
import { InternalServerError, MethodNotAllowedError } from "./GestaeError";
import { ResourceEvent } from "./ResourceEvent";
import { 
    ResourceActionEnum, 
    RESOURCE_METADATA_KEY, 
    IResourceOptions,
    IResourceNode,
    RESOURCE_NAME
} from "./Resource";
import { AbstractTaskableNode } from "./TaskNode";
import { CreateResourceHandler } from "./CreateResourceHandler";
import { ResourceHandler } from "./ResourceHandler";
import { ReadResourceHandler } from "./ReadResourceHandler";
import { UpdateResourceHandler } from "./UpdateResourceHandler";
import { DeleteResourceHandler } from "./DeleteResourceHandler";
import { IDResourceHandler } from "./IDResourceHandler";
import { IResource } from "./ResourceManager";

const RESOURCE_HANDLER_KEY = "resourceHandler";

interface IResourceContext {
    id?:            string;
    instance:       any;
    action:         ResourceActionEnum;
    overrideEvent?: ResourceEvent;
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

    constructor(target: GestaeClassType, options: IResourceOptions = {}) {
        super(target, options);
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
        return RESOURCE_NAME;
    }

    get endpoint(): boolean {
        return true;
    }

    get resourceKey(): string {
        return this.resourceId ?? this.model.name;
    }

    getResource<T extends {}>(context: HttpContext): IResource<T> {
        return context.resourceManager.get<T>(this);
    }

    async getResourceValue<T extends {}>(context: IHttpContext, options?: Record<string, any>): Promise<T> {
        return context.resources.getValue<T>(this, options);
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
            throw new MethodNotAllowedError(
                `Method '${method}' is not supported on resource '${this.name}'.`
            );
        return _action;
    }

    protected getIdResourceHandler(action: ResourceActionEnum, id: string): IDResourceHandler {
        switch(action) {
            case ResourceActionEnum.Read:
                return new ReadResourceHandler(this, id);
            case ResourceActionEnum.Update:
                return new UpdateResourceHandler(this, id);
            case ResourceActionEnum.Delete:
                return new DeleteResourceHandler(this, id);
            default: 
                throw new MethodNotAllowedError(`'${this.constructor.name}' '${this.name}' does not support action '${action}'`);
        }
    }

    protected getResourceHandler(action: ResourceActionEnum, id?: string): ResourceHandler {
        if(action === ResourceActionEnum.Create)
            return new CreateResourceHandler(this);
        else {
            if(!id)
                throw new MethodNotAllowedError(
                    `'${this.constructor.name}' '${this.name}' requires an ID for action '${action}'.`
                );
            return this.getIdResourceHandler(action, id);
        }
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        const _id     = context.request.uriTree.next;
        const _action = this.getSupportedAction(context.request.method, _id, 
                                                context.request.uriTree.target);
        
        // Got the resource handler.
        const _handler = this.getResourceHandler(_action, _id);
        context.setValue(`${this.fullyQualifiedPath}:${RESOURCE_HANDLER_KEY}`, _handler);

        await _handler.beforeRequest(context); // do nothing with the results.
    }

    public async onRequest(context: HttpContext): Promise<void> {
        const _handler = context.getValue<ResourceHandler>(`${this.fullyQualifiedPath}:${RESOURCE_HANDLER_KEY}`);
        if(!_handler) // defensive coding
            throw new InternalServerError(`Resource handler not found for '${this.constructor.name}' '${this.name}'.`);
        context.response.send(await _handler.onRequest(context));
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        const _handler = context.getValue<ResourceHandler>(`${this.fullyQualifiedPath}:${RESOURCE_HANDLER_KEY}`);
        if(!_handler) // defensive coding
            throw new InternalServerError(`Resource handler not found for '${this.constructor.name}' '${this.name}'.`);
        await _handler.afterRequest(context); // do nothing with the results.
    }

    static create(aClass: GestaeClassType, options: IResourceOptions = {}): ResourceNode {
        return new ResourceNode(aClass, getsertClassMetadata(aClass, RESOURCE_METADATA_KEY, options));
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNodeFactory extends AbstractNodeFactoryChain<IResourceOptions, ResourceNode> {
    isNodeFactory(target: NodeTemplate): boolean {
        return isClassConstructor(target.node) && hasClassMetadata(target.node, RESOURCE_METADATA_KEY);
    }

    onCreate(target: NodeTemplate): FactoryReturnType<IResourceOptions, ResourceNode> {
        return {top: ResourceNode.create((target.node as GestaeClassType))};
    }
}
