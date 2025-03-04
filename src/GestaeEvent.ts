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

import "reflect-metadata";
import { IHttpContext } from "./HttpContext";
import { IApplicationContext } from "./ApplicationContext";
import { 
    getsertMetadata,
    hasMetadata,
    IOptions,
} from "./Gestae";
import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { AbstractNode } from "./Node";

const EVENT_OPTIONS_KEY = "gestaejs:event";

/**
 * @description Interface for defining the event register.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type EventRegisterType = {
    method?: string,
    topic?: string, 
    operation: string, 
    action: string
};

/**
 * @description Type for the object structure returned by `defineEvents`.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type EventRegistry = Record<
    string, // Capitalized operation names
    Record<
        `On${Capitalize<string>}`, // Event names like "OnBefore", "OnAfter"
        EventRegisterType
    >
>;

/**
 * @description Interface for defingin options on an event.
 * @example Event registers are formatted as {method:string | Function, topic?: string, operation: string, action: string};
 * @example The full event format in Gestae is: gestaejs:<node-type>:<path>:<node-name>:<operation>:[<topic>]:<action>
 * @example gestaejs:resource:api:business:employee:read:on
 * @param register The event to register.
 * @param once     If true, the event will be removed after it is called once.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IEventOptions extends IOptions {
    register?: EventRegisterType;
    once?: boolean;
    dataAsTarget?: boolean;
}

/**
 * @description base class for all events in Gestae.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class GestaeEvent<T> {
    private _cancled: boolean = false;
    private _casue: any = null;
    public data?: T;
    public path: string = "gestaejs";

    constructor(data?: T) {
        this.data = data;
    }

    cancel(cause?: any): void {
        this._cancled = true;
        this._casue = cause;
    }

    get cancled(): boolean {
        return this._cancled;
    }

    get cause(): any {
        return this._casue;
    }   
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ApplicationEvent<T> extends GestaeEvent<T> {
    public readonly context: IApplicationContext;

    constructor(context: IApplicationContext, data: T, ) {
        super(data);
        this.context = context;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpEvent<T> extends GestaeEvent<T> {
    public readonly context: IHttpContext;

    constructor(context: IHttpContext, data?: T, ) {
        super(data);
        this.context = context;
    }
}



/**
 * @description Formats an EventRegisterType to a delimitted string using ':'.
 * @param event The event to format.
 * @returns A ':' delimited string of the event.
 * @example employee:task:before or resource:after
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const formatEvent = (event: EventRegisterType): string => {
    return (event.topic ? event.topic + ":" : "") + event.operation + ":" + event.action;
}

/**
 * @description Sets the event configuration for a target.
 * @param target 
 * @param event 
 * @param options 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setEventConfig = (target: any, event: EventRegisterType, property: string, options: IEventOptions = {}): void => {
    let _namesapce = formatEvent(event);
    let _config: Record<string, any> = getsertMetadata(target, EVENT_OPTIONS_KEY);

    let _event = _config[_namesapce];
    if(!_event) {
        _event = [];
        _config[_namesapce] = _event;
    }

    event.method         = property;
    options.register     = event;
    options.dataAsTarget = options.dataAsTarget ?? false;
    
    // Default the overloads to true if not specified.
    if(options.$overloads === undefined) options.$overloads = true;

    _event.push(options);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class EventFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory<T extends Object>(node: AbstractNode<any>, target: T): boolean {
        return hasMetadata(target, EVENT_OPTIONS_KEY);
    }

    _apply<T extends Object>(node: AbstractNode<any>, target: T): void {
        //const _log = this.log.clone({function: "_apply"});
        this.log.debug(`'${target.constructor.name}' is decorated with @On<Asyn><Type>Event(s), applying event listeners for '${node.name}'...`);
        const _config = getsertMetadata(target, EVENT_OPTIONS_KEY);
        for(const _key in _config) {
            const _events = _config[_key];
            for(const _event of _events) {
                const _fullyQualifiedEventPath = `${node.fullyQualifiedPath}:${formatEvent(_event.register)}`;
                this.log.debug(`Registering event '${_fullyQualifiedEventPath}'`);
                const _method = EventFeatureFactory.getMethod(target, _event.register.method);
                if(_method) {
                    this.context.eventQueue.on(_fullyQualifiedEventPath, 
                        _method as (event: GestaeEvent<unknown>) => void | Promise<void>, 
                        _event.once);
                        this.log.debug(`Method '${_event.register.method}' of '${target.constructor.name}' registered on '${_fullyQualifiedEventPath}'.`);
                }
                else 
                this.log.warn(`Method '${_event.register.method}' not found on '${target.constructor.name}', skipping event registration.'`);
            }
        }
        this.log.debug(`'Applied event listeners for '${node.name}'.`);
    }

    static getMethod(instance: object, method: string): Function | undefined {
        return Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(instance), method)?.value;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, descriptor: PropertyDescriptor) {
        setEventConfig(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnApplicationEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent<E>) => void>) {
        setEventConfig(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncApplicationEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent<E>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnHttpEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<E>) => void>) {
        setEventConfig(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncHttpEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<E>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.