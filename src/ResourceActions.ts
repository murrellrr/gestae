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

import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { 
    getsertClassMetadata,
    getsertObjectMetadata,
    hasClassMetadata,
    IOptions 
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { 
    createEventPathFromNode, 
    EventRegisterType 
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { 
    RESOURCE_METADATA_KEY, 
    ResourceActionEnum 
} from "./Resource";
import { ResourceEvent, ResourceEvents } from "./ResourceEvent";
import { ResourceNode } from "./ResourceNode";

export const RESOUREC_ACTION_METADATA_KEY = `${RESOURCE_METADATA_KEY}:action`;

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
const setResourceActionMetadata = (target: Object, action: ResourceActionEnum, property: string, 
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

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function AsyncCreateResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => Promise<void>>) {
        setResourceActionMetadata(target, ResourceActionEnum.Create, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function CreateResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => void>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Create, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function AsyncReadResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => Promise<void>>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Read, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function ReadResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => void>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Read, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function AsyncUpdateResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => Promise<void>>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Update, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function UpdateResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => void>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Update, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function AsyncDeleteResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => Promise<void>>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Delete, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function DeleteResource<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => void>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Delete, property, options);
    };
} // Cant be constant because it is used as a decorator.

export class ResourceFeatureFactory extends AbstractFeatureFactoryChain<ResourceNode> {
    isFeatureFactory(node: ResourceNode): boolean {
        return hasClassMetadata(node.model, RESOUREC_ACTION_METADATA_KEY);
    }

    onApply(node: ResourceNode): void {
        const _metadata = getsertClassMetadata(node.model, RESOUREC_ACTION_METADATA_KEY);
        this.log.debug(`Binding events for node '${node.name}'.`);
        for(const _action in _metadata) {
            const _actionMetadata = _metadata[_action];

            // Get the method.
            let _method: Function = node.model.prototype[_actionMetadata.method];
            if(!_method) 
                throw new GestaeError(`Method '${_actionMetadata.method}' not found on '${node.model.constructor.name}'.`);

            let _event     = ResourceFeatureFactory.getResourceEvent(_actionMetadata.action);
            let _eventName = `${createEventPathFromNode(node, _event)}`;

            this.log.debug(`Binding method '${node.model.constructor.name}.${_actionMetadata.method}' on action '${_action}' to event '${_eventName}' for node '${node.name}'.`);
            this.context.eventQueue.on(_eventName, async (event: ResourceEvent<any>) => {
                try {
                    if(!event.data) throw new GestaeError(`ResourceEvent must have data.`); // Defensive coding.
                    await _method.call(event.data, event.context);
                }
                catch(error) {
                    event.cancel(GestaeError.toError(error));
                }
            });
        }
    }

    static getResourceEvent(action: ResourceActionEnum): EventRegisterType {
        switch(action) {
            case ResourceActionEnum.Create: 
                return ResourceEvents.Create.On;
            case ResourceActionEnum.Read: 
                return ResourceEvents.Read.On;
            case ResourceActionEnum.Update: 
                return ResourceEvents.Update.On;
            case ResourceActionEnum.Delete: 
                return ResourceEvents.Delete.On;
            default: 
                throw new GestaeError(`Action '${action}' not supported.`);
        }
    }
}