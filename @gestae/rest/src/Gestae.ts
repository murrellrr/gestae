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

import { GestaeError } from "./GestaeError";
import { SchemaObject } from "ajv";
import "reflect-metadata";

const PAYLOAD_KEY   = "gestaejs:payloads";
const NAMESPACE_KEY = "gestaejs:namespace";
const RESOURCE_KEY  = "gestaejs:resources";
const TASK_KEY      = "gestaejs:tasks";
const EVENT_KEY     = "gestaejs:events";

/**
 * @description Interface for the event registration.
 */
export interface IEventRegister {
    topic?: string,
    operation: string, 
    action: string
};

/**
 * @description Interface for the event handler.
 */
export interface IEventHandler {
    event: IEventRegister;
    method: string;
    once: boolean;
}

export interface IOptions {
    $extends?: string;
}

/**
 * @description Sets the metadata for the event.
 * @param target 
 * @param event 
 * @param key 
 * @param property 
 */
export function setEventMetaData<T extends Object, E extends IEventRegister>(
        target: T, event: E, property: string, once: boolean = false) {
    
    let _events: Record<string, IEventHandler> = Reflect.getMetadata(TASK_KEY, target);
    if(!_events) {
        _events = {} as Record<string, IEventHandler>;
        Reflect.defineMetadata(EVENT_KEY, _events , target);
    }

    if(_events[property])
        throw new GestaeError(`Resource decorator can only be applied once for ${property}.`);
    else _events[property] = { event, method: property, once };
}

/**
 * @description Validates the descriptor to ensure that the method signature is correct.
 * @param _Type The type to validate against.
 * @param property The property name.
 * @param descriptor The descriptor to validate.
 */
export function validateTybedDescriptor<T>(property: string, descriptor: TypedPropertyDescriptor<any>): 
        asserts descriptor is TypedPropertyDescriptor<T> {
    if(!descriptor.value)
        throw new GestaeError(`Method ${String(property)} is undefined.`);

    const _testFuntion: T = descriptor.value;
    if(_testFuntion !== descriptor.value)
        throw new GestaeError(`Method ${String(property)} has an invalid signature.`);
}

/**
 * @description Validates the descriptor and sets the metadata.
 * @param target 
 * @param descriptor 
 * @param event 
 * @param key 
 * @param property 
 * @param once
 */
export function validateAndSetTypedEventMetaData<T extends Object, E extends IEventRegister>(
        target: T, descriptor: TypedPropertyDescriptor<any>, 
        event: E, property: string, once: boolean = false) {
    validateTybedDescriptor(property, descriptor);
    setEventMetaData(target, event, property, once);
}

export function setMultiInheritenceOptions<T extends IOptions>(target: new (... args: [any]) => any, key: string, options: T): void {
    let _options: Record<string, T> = Reflect.getMetadata(key, target);
    if(!_options) {
        _options = {} as Record<string, T>;
        Reflect.defineMetadata(key, _options , target);
    }

    if(_options[target.name])
        throw new GestaeError(`Duplicate target '${target.name}' added to '${key}' metadata.`);

    const _parent = Object.getPrototypeOf(target);
    if(_parent.name) options.$extends = _parent.name;

    _options[target.name] = options;
}

/**
 * @description Options for a namespace.
 */
export interface INamespaceOptions extends IOptions {
    name?: string;
}

/**
 * 
 * @param options 
 * @returns 
 */
export function Namespace(options: INamespaceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name;
        if(Reflect.hasMetadata(RESOURCE_KEY, target) || Reflect.hasMetadata(TASK_KEY, target) || Reflect.hasMetadata(PAYLOAD_KEY, target))
            throw new GestaeError(`Namespace decorator cannot be applied to '${target.name}' of type Payload, Resource, or Task .`);
        if(Reflect.hasMetadata(NAMESPACE_KEY, target))
            throw new GestaeError(`Namespace decorator can only be applied once for ${target.name}.`);
        Reflect.defineMetadata(NAMESPACE_KEY, true, target);
    };
}

/**
 * @description Options for a resource.
 */
export interface IResourceOptions extends IOptions {
    name?: string;
    idProperty?: string;
    useSchemaDefaults?: boolean;
    lazyLoad?: boolean;
};

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 */
export function Resource(options: IResourceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name;
        if(Reflect.hasMetadata(NAMESPACE_KEY, target))
            throw new GestaeError(`Resource decorator cannot be applied to a Namesapce '${target.name}'.`);
        setMultiInheritenceOptions(target, RESOURCE_KEY, options);
    };
}

/**
 * @description Options for a task.
 */
export interface ITaskOptions<I, O> extends IOptions {
    name: string;
    asynchronous?: boolean;
    input?: I;
    output?: O;
};

/**
 * @description Decorator for configuring a plain-old object as a task in Gestae.
 * @param options 
 * @returns 
 */
export function Task<I, O>(options: ITaskOptions<I, O>) {
    return function (target: new (... args: [any]) => any) {
        if(Reflect.hasMetadata(NAMESPACE_KEY, target))
            throw new GestaeError(`Task decorator cannot be applied to a Namesapce '${target.name}'.`);
        setMultiInheritenceOptions(target, TASK_KEY, options);
    };
}

/**
 * @description Options for a payload.
 */
export interface IPayloadOptions extends IOptions {
    name?: string;
    validate?: boolean;
    schema?: SchemaObject;
};

/**
 * @description Decorator for defining the payload schema of a plain-old object in Gestae.
 * @param options 
 * @returns 
 */
export function Payload(options: IPayloadOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name;
        if(Reflect.hasMetadata(NAMESPACE_KEY, target))
            throw new GestaeError(`Payload decorator cannot be applied to a Namesapce '${target.name}'.`);
        setMultiInheritenceOptions(target, PAYLOAD_KEY, options);
    };
}

/**
 * 
 * @param event 
 * @returns 
 */
export function OnEvent(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, descriptor: PropertyDescriptor) {
        //
    };
}