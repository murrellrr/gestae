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

import { GestaeObjectType } from "../../Gestae";
import { HttpContext } from "../../http/HttpContext";
import { IResourceNode } from "./IResourceNode";
import { IResourceItem } from "./manager/IResourceItem";
import { 
    ResourceActionEnum 
} from "./Resource";
import { 
    ResourceEvent, 
    ResourceEvents 
} from "./ResourceEvent";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractResourceHandler {
    public readonly resource: IResourceNode;
    public readonly target:   boolean;

    constructor(resource: IResourceNode, target: boolean = false) {
        this.resource = resource;
        this.target   = target;
    }

    async emit(context: HttpContext, event: ResourceEvent): Promise<void> {
        await context.applicationContext.eventEmitter.emit(event);
    }

    async emitData(context: HttpContext, event: string, data: IResourceItem<any>): Promise<void> {
        const _event: ResourceEvent = this.createEvent(context, event, data);
        await this.emit(context, _event);
    }

    abstract get action(): ResourceActionEnum;

    async getData(context: HttpContext): Promise<GestaeObjectType> {
        return context.request.getBody<GestaeObjectType>();
    }

    abstract createEvent(context: HttpContext, event: string, data: IResourceItem<any>): ResourceEvent;

    async beforeRequest(context: HttpContext): Promise<void> {
        let _data: GestaeObjectType = await this.getData(context);
        const _resource: IResourceItem<any> = context.resourceManager.setValue(this.resource, _data);
        await this.emitData(context, ResourceEvents.before, _resource);
    }

    async onRequest(context: HttpContext): Promise<void> {
        const _resource: IResourceItem<any> = context.resourceManager.get(this.resource);
        await this.emitData(context, ResourceEvents.on, _resource);
        if(this.target)
            context.response.send(await _resource.getValue());
    }

    async afterRequest(context: HttpContext): Promise<void> {
        const _resource: IResourceItem<any> = context.resourceManager.get(this.resource);
        await this.emitData(context, ResourceEvents.after, _resource);
    }
}