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
import _ from "lodash";

export type ClassType = new (...args: any[]) => any;

export interface IClassOptions {
    $overloads?: boolean;
    $extends?: string;
}

export interface IMethodOptions {
    $overloads?: boolean;
}

/**
 * @description Interface for defining the event register.
 */
export type EventRegisterType = {
    method?: string,
    topic?: string, 
    operation: string, 
    action: string
};

/**
 * @description Type for the object structure returned by `defineEvents`.
 */
export type EventRegistry = Record<
    string, // Capitalized operation names
    Record<
        `On${Capitalize<string>}`, // Event names like "OnBefore", "OnAfter"
        EventRegisterType
    >
>;

/**
 * @description Defines the events for a given set of operations and actions.
 * @param operations - The list of operation names.
 * @param actions - The list of action names.
 * @returns An object mapping operations to their corresponding events.
 */
export const defineEvents = (operations: string[], actions: string[]): EventRegistry => {
    return Object.fromEntries(
        operations.map(op => [
            op.charAt(0).toUpperCase() + op.slice(1), // Capitalize operation name
            Object.fromEntries(
                actions
                    .filter(action => action !== op) // Skip if action and operation are the same
                    .map(action => [
                        action === "on" ? "On" : `On${action.charAt(0).toUpperCase()}${action.slice(1)}`,
                        { operation: op, action }
                    ])
            )
        ])
    ) as EventRegistry;
};


/**
 * @description Gets the Reflect Metadata from a target, Class or Instance, structured by a key and 
 *              Class namespace. The method allows for metadata of both the super and sub classes be 
 *              stored.
 * @example     {
 *                  "SupoerClassName": {
 *                     "key": {
 *                       "property_name": "property_value"
 *                     },
 *                  },
 *                  "SubClassName": {
 *                     "key": {
 *                       "property_name": "property_value"
 *                     },
 *                     "$extends": "SupoerClassName"
 *                  }
 *              }
 * @param key     The property group to retrieve
 * @param target  The class or instance to set metatdata to.
 * @returns       The metadata for the target, or an empt object {}.
 */
const getReflectConfig = <O extends Object>(key: string, target: any, namespace: string): O => {
    // Upsert the root config element for the property key
    let _options = Reflect.getMetadata(key, target);
    if(!_options) {
        _options = {};
        Reflect.defineMetadata(key, _options, target);
    }

    // Upsert the target-specific config element
    if(!_options[namespace])
        _options[namespace] = {};

    return _options[namespace] as O;
};

export const getClassOptions = <O extends Object>(aClass: new (...args: any[]) => any, key: string): O => {
    return getReflectConfig<O>(key, aClass, aClass.name);
};

export const getInstanceOptions = <T extends Object, O extends Object>(instance: T, key: string): O => {
    return getReflectConfig<O>(key, instance, instance.constructor.name);
};

export const getConfig = <T extends Object, O extends Object>(instance: T, key: string): O => {
    return _.merge(
        getClassOptions<O>(instance.constructor as any, key),
        getInstanceOptions<T, O>(instance, key)
    );
};

export const hasOptionData = (target: any, key: string): boolean => {
    return Reflect.hasMetadata(key, target);
};

const setReflectConfig = <O extends Object>(key: string, target: any, namespace: string, options: O): void => {
    let _options = Reflect.getMetadata(key, target);
    if(!_options) {
        _options = {};
        Reflect.defineMetadata(key, _options, target);
    }

    // Upsert the target-specific config element
    let _target = _options[namespace];
    if(!_target) {
        _target = options;
        _options[namespace] = _target;
    }
};

export const setClassOptions = <O extends Object>(aClass: new (...args: any[]) => any, key: string, options: O): void => {
    const _prototype = Object.getPrototypeOf(aClass);
    if(_prototype?.name) {
        (options as any).$extends = _prototype.name;
    }
    setReflectConfig<O>(key, aClass, aClass.name, options);
};

export const setInstanceOptions = <T extends Object, O extends Object>(instance: T, key: string, options: O): void => {
    setReflectConfig<O>(key, instance, instance.constructor.name, options);
};

export const isClassConstructor = (target: any): target is new (...args: any[]) => any => {
    return (
        typeof target === "function" &&
        target.prototype &&
        typeof target.prototype === "object" &&
        Object.getOwnPropertyDescriptor(target, "prototype") !== undefined
    );
};

export const isPlainOleObject = (target: unknown): target is Record<string, any> => {
    return typeof target === "object" && target !== null && target.constructor === Object;
}
