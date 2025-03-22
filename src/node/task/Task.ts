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
    GestaeClassType,
    GestaeObjectType,
    IOptions,
    getsertClassMetadata,
    getsertObjectMetadata
} from "../../Gestae";
import { IHttpContext } from "../../http/IHttpContext";

export const TASK_METDADATA_KEY = "gestaejs:task";

export type TaskMethodType<I extends GestaeObjectType, O extends GestaeObjectType> = 
    (context: IHttpContext, input: I) => Promise<O>;

/**
 * @description Options for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ITaskOptions extends IOptions {
    name?:           string;
    dataAsTarget?:   boolean;
    method?:         string;
    inputType?:      GestaeObjectType;
    outputType?:     GestaeObjectType;
    $method?:        TaskMethodType<any, any>;
    $asynchrounous?: boolean;
};

const getsertTaskMetadata = (metadata: Record<string, any>, target: GestaeClassType | GestaeObjectType, 
                             name: string, options: ITaskOptions = {}): ITaskOptions => {
    let _task = metadata[name];
    if(!_task) {
        _task = options;
        metadata[name] = _task;
    }
    else throw GestaeError.toError(`Task '${name}' already exists on '${(typeof target === "object")? target.constructor.name : target.name}'.`);
    return _task;
};

export const getsertTaskObjectMetatdata = <T extends GestaeObjectType>(target: T, name: string, 
                                                                       options: ITaskOptions = {}): ITaskOptions => {
    return getsertTaskMetadata(getsertObjectMetadata(target, TASK_METDADATA_KEY), target,
                               name, options);
};

export const getsertTaskClassMetatdata = (target: GestaeClassType, name: string, 
                                          options: ITaskOptions = {}): ITaskOptions => {
    return getsertTaskMetadata(getsertClassMetadata(target, TASK_METDADATA_KEY), target,
                               name, options);
};

/**
 * @description Sets the method configuration for a target.
 * @param target 
 * @param property 
 * @param options 
 */
export const setTaskMethodMetadata = <T extends GestaeObjectType>(target: T, property: string, 
                                                                  options: ITaskOptions = {}): void => {
    options.name             = options.name ?? property.toLowerCase();
    const _metadata          = getsertTaskObjectMetatdata(target, options.name, options);
    _metadata.method         = property;
    _metadata.$overloads     = options.$overloads     ?? true;
    _metadata.$asynchrounous = options.$asynchrounous ?? false;
};

/**
 * @description Sets the event configuration for a target.
 * @param target 
 * @param event 
 * @param options 
 */
export const setTaskMetadata = (target: GestaeClassType, options: ITaskOptions = {}): void => {
    const _metadata          = getsertTaskClassMetatdata(target, options.name!, options);
    _metadata.$overloads     = options.$overloads     ?? true;
    _metadata.$asynchrounous = options.$asynchrounous ?? false;
};

/**
 * @description Generic `@AsyncTask` decorator for asynchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function TaskExecute<I extends GestaeObjectType, O extends GestaeObjectType>(options: ITaskOptions = {}) {
    return function <T extends GestaeObjectType>(target: T, property: string,
                                                 descriptor: TypedPropertyDescriptor<TaskMethodType<I, O>>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setTaskMethodMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function Task(name: string, options: ITaskOptions = {}) {
    return function (target: GestaeClassType) {
        options.name = name.toLowerCase();
        setTaskMetadata(target, options);
    };
} // Cant be constant because it is used as a decorator.