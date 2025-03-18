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
    getsertClassMetadata,
} from "../../Gestae";
import { IHttpContext } from "../../http/IHttpContext";
import { HttpContext } from "../../http/HttpContext";
import { InternalServerError } from "../../error/GestaeError";
import { MethodNotAllowedError } from "../../error/MethodNotAllowedError";
import { 
    ResourceActionEnum, 
    RESOURCE_METADATA_KEY, 
    IResourceOptions,
    RESOURCE_NAME
} from "./Resource";
import { AbstractTaskableNode } from "../task/AbstractTaskableNode";
import { CreateResourceHandler } from "./CreateResourceHandler";
import { AbstractResourceHandler } from "./AbstractResourceHandler";
import { ReadResourceHandler } from "./ReadResourceHandler";
import { UpdateResourceHandler } from "./UpdateResourceHandler";
import { DeleteResourceHandler } from "./DeleteResourceHandler";
import { AbstractIDResourceHandler } from "./AbstractIDResourceHandler";
import { IResourceItem } from "./manager/IResourceItem";
import { IResourceNode } from "./IResourceNode";
import { HttpMethodEnum } from "../../http/HTTP";
import _ from "lodash";

const RESOURCE_HANDLER_KEY = "resourceHandler";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNode extends AbstractTaskableNode<IResourceOptions> implements IResourceNode {
    protected readonly idProperty:       string;
    protected readonly lazyLoad:         boolean;
    protected readonly supportedActions: ResourceActionEnum[];

    constructor(target: GestaeClassType, options: IResourceOptions = {}) {
        // Ensure the resource name is properly overridden.
        options.name = options.resourceId ?? options.name?.toLowerCase() ?? target.name.toLowerCase();
        super(target, options);
        this.idProperty = options.idProperty ?? "id";
        this.lazyLoad   = options.lazyLoad ?? true;
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

    createResource<T extends GestaeObjectType>(id: string): T {
        let _instance = this.getInstance();
        _instance[this.idProperty] = id;
        return _instance as T;
    }

    mergeResource<T extends GestaeObjectType>(source: T, id?: string): T {
        let _target = (id)? this.createResource(id) : this.getInstance();
        return _.merge(_target, source) as T;
    }

    getResource<T extends GestaeObjectType>(context: IHttpContext): IResourceItem<T> {
        return context.resources.get<T>(this);
    }

    async getResourceValue<T extends GestaeObjectType>(context: IHttpContext, 
                                                       options?: Record<string, any>): Promise<T> {
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

    protected getIdResourceHandler(action: ResourceActionEnum, target:boolean, id: string): AbstractIDResourceHandler {
        switch(action) {
            case ResourceActionEnum.Read:
                return new ReadResourceHandler(this, target, id,);
            case ResourceActionEnum.Update:
                return new UpdateResourceHandler(this, target, id);
            case ResourceActionEnum.Delete:
                return new DeleteResourceHandler(this, target, id);
            default: 
                throw new MethodNotAllowedError(`'${this.constructor.name}' '${this.name}' does not support action '${action}'`);
        }
    }

    protected getResourceHandler(action: ResourceActionEnum, target:boolean, id?: string): AbstractResourceHandler {
        if(action === ResourceActionEnum.Create)
            return new CreateResourceHandler(this, target);
        else {
            if(!id)
                throw new MethodNotAllowedError(
                    `'${this.constructor.name}' '${this.name}' requires an ID for action '${action}'.`
                );
            return this.getIdResourceHandler(action, target, id);
        }
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        const _id     = context.request.uriTree.next;
        const _action = this.getSupportedAction(context.request.method, _id, 
                                                context.request.uriTree.target);
        // Got the resource handler.
        const _handler = this.getResourceHandler(_action, context.request.uriTree.target, _id);
        context.setValue(`${this.fullyQualifiedPath}:${RESOURCE_HANDLER_KEY}`, _handler);

        await _handler.beforeRequest(context);
    }

    public async onRequest(context: HttpContext): Promise<void> {
        const _handler = context.getValue<AbstractResourceHandler>(`${this.fullyQualifiedPath}:${RESOURCE_HANDLER_KEY}`);
        if(!_handler) // defensive coding
            throw new InternalServerError(`Resource handler not found for '${this.constructor.name}' '${this.name}'.`);
        await _handler.onRequest(context);
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        const _handler = context.getValue<AbstractResourceHandler>(`${this.fullyQualifiedPath}:${RESOURCE_HANDLER_KEY}`);
        if(!_handler) // defensive coding
            throw new InternalServerError(`Resource handler not found for '${this.constructor.name}' '${this.name}'.`);
        await _handler.afterRequest(context);
    }

    static create(aClass: GestaeClassType, options: IResourceOptions = {}): ResourceNode {
        return new ResourceNode(aClass, getsertClassMetadata(aClass, RESOURCE_METADATA_KEY, options));
    }
}
