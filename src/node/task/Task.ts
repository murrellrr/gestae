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

import { HttpMethodEnum } from "../../http/HTTP";
import { 
    GestaeObjectType,
    IOptions,
    getsertObjectMetadata
} from "../../Gestae";
import { GestaeError } from "../../error/GestaeError";
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
    $method?:        TaskMethodType<any, any>;
    $asynchrounous?: boolean;
};

/**
 * @description Sets the event configuration for a target.
 * @param target 
 * @param event 
 * @param options 
 */
export const setTaskMetadata = <T extends Object>(target: T, property: string, options: ITaskOptions = {}): void => {
    let _taskName = options.name?.toLowerCase() ?? property.toLowerCase();
    let _target   = getsertObjectMetadata(target, TASK_METDADATA_KEY);

    let _task = _target[_taskName];
    if(!_task) {
        _task = {};
        _target[_taskName] = _task;
    }

    // set the task type info...
    _task.method         = property;
    _task.name           = _taskName;
    _task.$overloads     = options.$overloads ?? true;
    _task.$asynchrounous = options.$asynchrounous ?? false;
};

/**
 * @description Generic `@AsyncTask` decorator for asynchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function TaskExecute<I extends GestaeObjectType, O extends GestaeObjectType>(options: ITaskOptions = {}) {
    options.dataAsTarget = options.dataAsTarget ?? true;
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<TaskMethodType<I, O>>) {
        const originalMethod = descriptor.value;
        if (!originalMethod) return;

        const paramTypes = Reflect.getMetadata("design:paramtypes", target, property) || [];
        const returnType = Reflect.getMetadata("design:returntype", target, property);

        if(paramTypes.length != 2)
            throw GestaeError.toError(`Task decorator requires the first parameter as a context and the second as input type in method: ${property}`);

        const ContextType = paramTypes[0];
        const InputType   = paramTypes[1];

        descriptor.value = async function (context: IHttpContext, input: I) {
            if(!(context instanceof ContextType))
                throw GestaeError.toError(
                    `Task decorator '${property}' expected second argument of type ${ContextType.name}, but received ${typeof context}`
                );
            if(!(input instanceof InputType))
                throw GestaeError.toError(
                    `Task decorator '${property}' expected first argument of type ${InputType.name}, but received ${typeof input}`
                );

            const result = await originalMethod.call(this, context, input); // Only passing the required arguments

            if(returnType && !(result instanceof returnType))
                throw GestaeError.toError(
                    `Task decorator '${property}' expected return type ${returnType.name}, but got ${typeof result}`
                );

            return result;
        };

        options.method         = property;
        options.name           = options.name?.toLowerCase() ?? property.toLowerCase();
        options.requestMethod  = options.requestMethod ?? HttpMethodEnum.Post;
        options.$overloads     = options.$overloads ?? true;

        setTaskMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.