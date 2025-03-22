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
import { 
    getsertClassMetadata,
    getsertObjectMetadata,
    IOptions,
} from "../Gestae";
import { INode } from "../node/INode";
import { ApplicationEvent } from "../application/ApplicationEvent";

export const EVENT_OPTIONS_KEY = "gestaejs:event";

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
    register?:     EventRegisterType;
    once?:         boolean;
    dataAsTarget?: boolean;
}

/**
 * @description base class for all events in Gestae.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class GestaeEvent<T = {[key: symbol | string]: any}> {
    private _cancled: boolean = false;
    private _casue:   any = null;
    public data:      T;
    public path:      string = "gestaejs";

    constructor(data: T, path?: string) {
        this.data = data ?? {} as T;
        this.path = path ?? "gestaejs";
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
 * @description
 * @param operation
 * @param action 
 * @returns 
 */
export const createEventRegister = (operation: string, action: string, topic?: string) => {
    return {
        operation: operation, 
        action:    action,
        ...(topic ? { topic } : {})
    } as EventRegisterType;
};

/**
 * @description Formats an EventRegisterType to a delimitted string using ':'.
 * @param event The event to format.
 * @param topic Optional, The topic to use.
 * @returns A ':' delimited string of the event.
 * @example employee:task:before or resource:after
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const createEventPathFromRegister = (event: EventRegisterType, topic?: string): string => {
    event.topic = topic ?? event.topic;

    let path = '';
    if(event.topic) path += `${event.topic}:`;
    if(event.operation) path += `${event.operation}:`;
    path += event.action;

    return path;
}

/**
 * @description
 * @param node @description
 * @param event 
 * @param topic 
 * @returns 
 */
export const createEventPathFromNode = (node: INode, event: EventRegisterType, topic?: string): string => {
    return `gestaejs:${node.fullyQualifiedPath}:${createEventPathFromRegister(event, topic)}`;
};

/**
 * @desciription
 * @param event 
 * @param path 
 * @returns 
 */
export const createEventPath = (event: EventRegisterType, path: string): string => {
    return `gestaejs:${path}:${createEventPathFromRegister(event)}`;
}

export const createApplicationEventPath = (event: EventRegisterType) => {
    return createEventPath(event, "application");
}

export const createHttpEventPath = (event: EventRegisterType) => {
    return createEventPath(event, "http");
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
export const setEventMetadata = (target: any, event: EventRegisterType, property: string, options: IEventOptions = {}): void => {
    let _namesapce = createEventPathFromRegister(event);
    let _metadata: Record<string, any> = getsertObjectMetadata(target, EVENT_OPTIONS_KEY);

    let _event = _metadata[_namesapce];
    if(!_event) {
        _event = [];
        _metadata[_namesapce] = _event;
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
export function OnEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, descriptor: PropertyDescriptor) {
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnApplicationEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent) => Promise<void>>) {
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.