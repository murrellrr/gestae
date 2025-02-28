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
    EventRegisterType,
    getInstanceOptions,
    hasOptionData,
    IMethodOptions,
    isPlainOleObject
} from "./Gestae";
import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { AbstractPart } from "./Part";

const EVENT_OPTIONS_KEY = "gestaejs:event";

/**
 * @description Interface for defingin options on an event.
 * @param once If true, the event will be removed after it is called once.
 */
export interface IEventOptions extends IMethodOptions {
    register?: EventRegisterType;
    once?: boolean;
}

export class GestaeEvent<T> {
    private _cancled: boolean = false;
    private _casue: any = null;
    public data: T;
    public path: string = "gestaejs";

    constructor(data: T) {
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

export class ApplicationEvent<T> extends GestaeEvent<T> {
    public readonly context: IApplicationContext;

    constructor(context: IApplicationContext, data: T, ) {
        super(data);
        this.context = context;
    }
}

export class HttpEvent<T> extends GestaeEvent<T> {
    public readonly context: IHttpContext;

    constructor(context: IHttpContext, data: T, ) {
        super(data);
        this.context = context;
    }
}

/**
 * @description Formats an EventRegisterType to a delimitted string using ':'.
 * @param event The event to format.
 * @returns A ':' delimited string of the event.
 * @example employee:task:before or resource:after
 */
export function formatEvent(event: EventRegisterType): string {
    return (event.topic ? event.topic + ":" : "") + event.operation + ":" + event.action;
}

/**
 * @description Sets the event configuration for a target.
 * @param target 
 * @param event 
 * @param options 
 */
export function setEventConfig(target: any, event: EventRegisterType, property: string, options: IEventOptions = {}): void {
    let _namesapce = formatEvent(event);
    let _config: { [key: string]: any } = getInstanceOptions(target, EVENT_OPTIONS_KEY);

    let _event = _config[_namesapce];
    if(!_event) {
        _event = [];
        _config[_namesapce] = _event;
    }

    // Set up and extensions.
    const _prototype = Object.getPrototypeOf(target.constructor);
    if(_prototype?.name) (_config as any).$extends = _prototype?.name;

    event.method = property;
    options.register = event;
    
    // Default the overloads to true if not specified.
    if(options.$overloads === undefined) options.$overloads = true;

    _event.push(options);
}

export class EventFeatureFactory extends AbstractFeatureFactoryChain<AbstractPart<any>> {
    isFeatureFactory<T extends Object>(part: AbstractPart<any>, target: T): boolean {
        return hasOptionData(target, EVENT_OPTIONS_KEY);
    }

    _apply<T extends Object>(part: AbstractPart<any>, target: T): void {
        //
    }
}

export function OnEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, descriptor: PropertyDescriptor) {
        setEventConfig(target, event, property, options);
    };
}

export function OnApplicationEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent<E>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnAsyncApplicationEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent<E>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnHttpEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<E>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnAsyncHttpEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<E>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}