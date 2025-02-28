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
import { AbstractPartFactoryChain, FactoryReturnType } from "./AbstractPartFactoryChain";
import { IApplicationContext } from "./ApplicationContext";
import { 
    defineEvents,
    EventRegisterType,
    getInstanceOptions,
    hasOptionData,
    IClassOptions
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { 
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { HttpMethodEnum, IHttpContext } from "./HttpContext";
import { AbstractPart } from "./Part";

const TASK_OPTION_KEY = "gestaejs:task";

/**
 * @description Options for a resource.
 */
export interface ITaskOptions extends IClassOptions {
    name?: string;
    method?: string;
    asynchrounous?: boolean;
    requestMethod?: HttpMethodEnum;
};

export interface ITask {
    getTakOptions(): ITaskOptions;
}

export const TaskEvents = defineEvents(
    ["execute", "cancel", "retry", "error"],
    ["before", "after", "error"]
);

export class TaskEvent<T> extends HttpEvent<T> {
    public readonly task: ITask;

    constructor(task: ITask, context: IHttpContext, data: T) {
        super(context, data);
        this.task = task;
    }
}

export class TaskPart extends AbstractPart<ITaskOptions> {
    
    constructor(target: new (...args: any[]) => any, context: IApplicationContext, options: ITaskOptions = {}) {
        super(target, context, options);
        options.name = options.name ?? target.name.toLowerCase();
        options.asynchrounous = options.asynchrounous ?? false;
        options.requestMethod = options.requestMethod ?? HttpMethodEnum.POST;
    }

    async _initialize(): Promise<void> {
        //
    }

    async _finalize(): Promise<void> {
        //
    }
    
}

export class TaskFeatureFactory extends AbstractFeatureFactoryChain<TaskPart> {
    isFeatureFactory<T extends Object>(part: TaskPart, target: T): boolean {
        return hasOptionData(target, TASK_OPTION_KEY);
    }

    _apply<T extends Object>(part: TaskPart, target: T): void {
        this.log.debug(`${target.constructor.name} is a Task, adding task parts.`);
        const options = getInstanceOptions(target, TASK_OPTION_KEY);
        this.log.debug(`Task options: ${JSON.stringify(options, null, 2)}`);
    }
}

export function OnTaskEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: TaskEvent<I>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnAsyncTaskEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: TaskEvent<I>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}

/**
 * @description Sets the event configuration for a target.
 * @param target 
 * @param event 
 * @param options 
 */
export const setTaskConfig = <T extends Object>(target: T, property: string, options: ITaskOptions = {}): void => {
    let _namespace = target.constructor.name;
    let _taskName = options.name ?? property;
    let _config: { [key: string]: any } = getInstanceOptions(target, TASK_OPTION_KEY);

    let _class: { [key: string]: any } = _config[_namespace];
    if(!_class) {
        _class = {};
        _config[_namespace] = _class;
    }

    // Set up and extensions.
    const _prototype = Object.getPrototypeOf(target.constructor);
    if(_prototype?.name) (_class as any).$extends = _prototype?.name;

    let _task = _class[_taskName];
    if(!_task) {
        _task = {};
        _class[_taskName] = _task;
    }

    // set the task type info...
    _task.method = property;
    _task.requestMethod = options.requestMethod ?? HttpMethodEnum.POST;
    
    // Default the overloads to true if not specified.
    if(_task.$overloads === undefined) options.$overloads = true;
};

export const getTaskConfig = <T extends Object>(target: T, property: string) => {

};


/**
 * Utility type to infer `void` return type when omitted.
 */
type InferReturnType<R> = R extends undefined ? void : R;

/**
 * Generic `@Task` decorator for synchronous functions.
 */
export function Task<I, R = void>(options: ITaskOptions = {}) {
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<(firstArg: I, context: IHttpContext) => InferReturnType<R>>) {
        const originalMethod = descriptor.value;
        if (!originalMethod) return;

        const paramTypes = Reflect.getMetadata("design:paramtypes", target, property) || [];
        if (paramTypes.length != 2)
            throw GestaeError.toError(`@Task requires the first parameter as an input type and the second as context in method: ${property}`);

        const FirstArgType = paramTypes[0];
        const ContextType = paramTypes[1];

        descriptor.value = function (firstArg: I, context: IHttpContext) {
            if(!(firstArg instanceof FirstArgType))
                throw GestaeError.toError(
                    `@Task method '${property}' expected first argument of type ${FirstArgType.name}, but received ${typeof firstArg}`
                );

            if(!(context instanceof ContextType))
                throw GestaeError.toError(
                    `@Task method '${property}' expected second argument of type ${ContextType.name}, but received ${typeof context}`
                );

            return originalMethod.apply(this, [firstArg, context]); // Only passing the required arguments
        };

        setTaskConfig(target, property, options);
    };
}

/**
 * Generic `@AsyncTask` decorator for asynchronous functions.
 */
export function AsyncTask<I, R = void>(options: ITaskOptions = {}) {
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<(firstArg: I, context: IHttpContext) => Promise<InferReturnType<R>>>) {
        const originalMethod = descriptor.value;
        if (!originalMethod) return;

        const paramTypes = Reflect.getMetadata("design:paramtypes", target, property) || [];
        const returnType = Reflect.getMetadata("design:returntype", target, property);

        if(paramTypes.length != 2)
            throw GestaeError.toError(`@AsyncTask requires the first parameter as an input type and the second as context in method: ${property}`);

        const FirstArgType = paramTypes[0];
        const ContextType = paramTypes[1];

        descriptor.value = async function (firstArg: I, context: IHttpContext) {
            if (!(firstArg instanceof FirstArgType))
                throw GestaeError.toError(
                    `@AsyncTask method '${property}' expected first argument of type ${FirstArgType.name}, but received ${typeof firstArg}`
                );

            if (!(context instanceof ContextType))
                throw GestaeError.toError(
                    `@AsyncTask method '${property}' expected second argument of type ${ContextType.name}, but received ${typeof context}`
                );

            const result = await originalMethod.apply(this, [firstArg, context]); // Only passing the required arguments

            if (returnType && !(result instanceof returnType))
                throw GestaeError.toError(
                    `@AsyncTask method '${property}' expected return type ${returnType.name}, but got ${typeof result}`
                );

            return result;
        };

        setTaskConfig(target, property, options);
    };
}


