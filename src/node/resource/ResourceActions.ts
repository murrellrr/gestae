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

import { GestaeError } from "../../error/GestaeError";
import { 
    GestaeObjectType, 
    IOptions, 
    getsertObjectMetadata 
} from "../../Gestae";
import { IHttpContext } from "../../http/IHttpContext";
import { CreateResourceEvent } from "./CreateResourceEvent";
import { DeleteResourceEvent } from "./DeleteResourceEvent";
import { IResourceItem } from "./manager/IResourceItem";
import { ReadResourceEvent } from "./ReadResourceEvent";
import { 
    RESOURCE_METADATA_KEY, 
    ResourceActionEnum 
} from "./Resource";
import { UpdateResourceEvent } from "./UpdateResourceEvent";

export const RESOUREC_ACTION_METADATA_KEY = `${RESOURCE_METADATA_KEY}:action`;

export type CreateResourceFunctionType = (context: IHttpContext, resource: IResourceItem<any>, body: GestaeObjectType) => Promise<void>;
export type ReadResourceFunctionType   = (context: IHttpContext, id: string) => Promise<void>;
export type UpdateResourceFunctionType = (context: IHttpContext, body: GestaeObjectType, patch: boolean) => Promise<void>;
export type DeleteResourceFunctionType = (context: IHttpContext, id: string, body?: GestaeObjectType) => Promise<void>;
export type ResourceEventType          = CreateResourceEvent | ReadResourceEvent | 
                                         UpdateResourceEvent | DeleteResourceEvent;
export type ResourceFunctionType       = CreateResourceFunctionType | ReadResourceFunctionType | 
                                         UpdateResourceFunctionType | DeleteResourceFunctionType;
export type ResourceEventHandlerType   = (event: ResourceEventType, method: ResourceFunctionType) => Promise<void>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceActionOptions extends IOptions {
    action?:         ResourceActionEnum;
    method?:         string;
    $asynchroneous?: boolean;
    $overloads?:     boolean;
};

/**
 * @description
 * 
 * @param target 
 * @param action 
 * @param property 
 * @param options 
 * 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setResourceActionMetadata = (target: Object, action: ResourceActionEnum, property: string, 
                                   options: IResourceActionOptions = {}) => {
    const _metadata = getsertObjectMetadata(target, RESOUREC_ACTION_METADATA_KEY);
    let _config = _metadata[action];
    if(!_config) {
        _config = {};
        _metadata[action] = _config;
    }

    if(_config.method && (_config.method !== property))
        throw new GestaeError(`Action '${action}' already has method assigned. Only one method can be assigned to an action.`);

    _config.method         = property;
    _config.action         = action;
    _config.$asynchroneous = options.$asynchroneous ?? false;
    _config.$overloads     = options.$overloads ?? false;
};

export const handleCreateEvent = async (event: CreateResourceEvent, method: CreateResourceFunctionType): Promise<void> => {
    event.context.log.debug(`ResourceActions.handleCreateEvent(${event.resource.name}): '${event.action}'`);
    const _body: GestaeObjectType = await event.getBody();
    const _data: GestaeObjectType = await event.data.getValue();
    await method.call(_data, event.context, event.data, _body);
};

export const handleReadEvent = async (event: ReadResourceEvent, method: ReadResourceFunctionType): Promise<void> => {
    event.context.log.debug(`ResourceActions.handleReadEvent(${event.resource.name}): '${event.action}'`);
    const _data = await event.data.getValue();
    await method.call(_data, event.context, event.id);
};

export const handleUpdateEvent = async (event: UpdateResourceEvent, method: UpdateResourceFunctionType): Promise<void> => {
    event.context.log.debug(`ResourceActions.handleUpdateEvent(${event.resource.name}): '${event.action}'`);
    await method.call(event.data, event.context, await event.getBody(), event.patch);
};

export const handleDeleteEvent = async (event: DeleteResourceEvent, method: DeleteResourceFunctionType): Promise<void> => {
    event.context.log.debug(`ResourceActions.handleDeleteEvent(${event.resource.name}): '${event.action}'`);
    await method.call(event.data, event.context, event.id, await event.getBody());
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function CreateResource(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<CreateResourceFunctionType>) {
        setResourceActionMetadata(target, ResourceActionEnum.Create, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function ReadResource(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<ReadResourceFunctionType>) {
        setResourceActionMetadata(target, ResourceActionEnum.Read, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function UpdateResource(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<UpdateResourceFunctionType>) {
        setResourceActionMetadata(target, ResourceActionEnum.Update, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function DeleteResource(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<DeleteResourceFunctionType>) {
        setResourceActionMetadata(target, ResourceActionEnum.Delete, property, options);
    };
} // Cant be constant because it is used as a decorator.