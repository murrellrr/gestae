import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { 
    getGestaeMetadata,
    getsertMetadata,
    hasMetadata, 
    IOptions 
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { EventRegisterType, formatEvent } from "./GestaeEvent";
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
    const _metadata = getsertMetadata(target, RESOUREC_ACTION_METADATA_KEY);
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
export function OnAsyncResourceCreate<T>(options: IResourceActionOptions = {}) {
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
export function OnResourceCreate<T>(options: IResourceActionOptions = {}) {
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
export function OnAsyncResourceRead<T>(options: IResourceActionOptions = {}) {
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
export function OnResourceRead<T>(options: IResourceActionOptions = {}) {
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
export function OnAsyncResourceUpdate<T>(options: IResourceActionOptions = {}) {
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
export function OnResourceUpdate<T>(options: IResourceActionOptions = {}) {
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
export function OnAsyncResourceDelete<T>(options: IResourceActionOptions = {}) {
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
export function OnResourceDelete<T>(options: IResourceActionOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(context: IHttpContext) => void>) {
        // options.dataAsTarget = options.dataAsTarget ?? true;
        setResourceActionMetadata(target, ResourceActionEnum.Delete, property, options);
    };
} // Cant be constant because it is used as a decorator.

export class ResourceFeatureFactory extends AbstractFeatureFactoryChain<ResourceNode> {
    isFeatureFactory<T extends Object>(node: ResourceNode, target: T): boolean {
        return hasMetadata(target, RESOUREC_ACTION_METADATA_KEY);
    }

    onApply<T extends Object>(node: ResourceNode, target: T): void {
        this.log.debug(`${target.constructor.name} '${node.name}' decorated with @On<sync>Resource<action>, mapping functions to actions.`);
        const _metadata = getsertMetadata(target, RESOUREC_ACTION_METADATA_KEY);

        for(const _action in _metadata) {
            const _config = _metadata[_action];
            let _method: Function = (target as any)[_config.method];
            if(!_method) 
                throw new GestaeError(`Method '${_config.method}' not found on '${target.constructor.name}'.`);
            let _event     = ResourceFeatureFactory.getResourceEvent(_config.action);
            let _eventName = `${node.fullyQualifiedPath}:${formatEvent(_event)}`;

            this.log.debug(`Binding resource action event '${_eventName}' to method '${_config.method}' on target '${target.constructor.name}'.`);
            this.context.eventQueue.on(_eventName, async (event: ResourceEvent<T>) => {
                if(!event.data) throw new GestaeError(`ResourceEvent must have data.`);
                _method = _method.bind(event.data);
                await _method(event.context);
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