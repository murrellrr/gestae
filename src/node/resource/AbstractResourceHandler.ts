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

    constructor(resource: IResourceNode) {
        this.resource = resource;
    }

    async emit(context: HttpContext, event: ResourceEvent): Promise<GestaeObjectType> {
        await context.applicationContext.eventEmitter.emit(event, event.data);
        return event.data;
    }

    async emitData(context: HttpContext, event: string, data: IResourceItem<any>): Promise<GestaeObjectType> {
        let _data = await this.emit(context, this.createEvent(context, event, data));
        context.log.debug(`ResourceHandler:emitData(_data): \r\n${JSON.stringify(_data, null, 2)}`);
        context.resourceManager.setValue(this.resource, _data);
        return _data;
    }

    abstract get action(): ResourceActionEnum;

    async getData(context: HttpContext): Promise<GestaeObjectType> {
        return context.request.getBody<GestaeObjectType>();
    }

    abstract createEvent(context: HttpContext, event: string, data: IResourceItem<any>): ResourceEvent;

    async beforeRequest(context: HttpContext): Promise<void> {
        const _data   = await this.getData(context);
        context.log.debug(`${this.constructor.name}:beforeRequest(_data): \r\n${JSON.stringify(_data, null, 2)}`);
        let _resource = context.resourceManager.setValue(this.resource, _data);
        //context.log.debug(`${this.constructor.name}:beforeRequest(_resource): \r\n${JSON.stringify(_resource, null, 2)}`);
        //context.log.debug(`${this.constructor.name}:beforeRequest(_resource): ${_resource.key}`);
        //const _resevent = new ResourceEvent(context, this.resource, this.action, ResourceEvents.before, _resource);
        // context.resourceManager.setValue(this.resource, await this.emit(context, _resevent));
        //return await this.emitData(context, ResourceEvents.before, _resource);
    }

    async onRequest(context: HttpContext): Promise<void> {
        const _resource  = context.resourceManager.get(this.resource);
        // const _resevent  = new ResourceEvent(context, this.resource, this.action, ResourceEvents.on, _resource);
        // context.resourceManager.setValue(this.resource, await this.emit(context, _resevent));
    }

    async afterRequest(context: HttpContext): Promise<void> {
        const _resource = context.resourceManager.get(this.resource);
        let   _data     = await this.emitData(context, ResourceEvents.after, _resource);
        const _resevent = new ResourceEvent(context, this.resource, this.action, ResourceEvents.on, _resource);
        // _data           = await this.emit(context, _resevent);
        // context.resourceManager.setValue(this.resource, _data);
    }
}