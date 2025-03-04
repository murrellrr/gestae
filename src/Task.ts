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

import { 
    defineEvents,
    EventRegisterType,
    getsertMetadata,
    hasMetadata,
    IOptions
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { 
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { 
    HttpMethodEnum, 
    IHttpContext 
} from "./HttpContext";
import { 
    AbstractNode, 
    INodeOptions 
} from "./AbstractNode";
import { InitializationContext } from "./ApplicationContext";

const TASK_OPTION_KEY = "gestaejs:task";

/**
 * @description Options for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ITaskOptions extends IOptions {
    name?: string;
    requestMethod?: HttpMethodEnum;
    $method?: string;
    $asynchrounous?: boolean;
};

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ITask {
    getTakOptions(): ITaskOptions;
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const TaskEvents = defineEvents(
    ["execute"],
    ["before", "on", "after", "error"]
);

/**
 * @description Sets the event configuration for a target.
 * @param target 
 * @param event 
 * @param options 
 */
export const setTaskMetadata = <T extends Object>(target: T, property: string, options: ITaskOptions = {}): void => {
    let _taskName = options.name?.toLowerCase() ?? property.toLowerCase();
    let _target   = getsertMetadata(target, TASK_OPTION_KEY, {});

    let _task = _target[_taskName];
    if(!_task) {
        _task = {};
        _target[_taskName] = _task;
    }

    // set the task type info...
    _task.$method = options.$method ?? property;
    _task.name = _taskName;
    _task.requestMethod = options.requestMethod ?? HttpMethodEnum.POST;
    _task.$asynchrounous = options.$asynchrounous ?? false;
    _task.$overloads = options.$overloads ?? true;
};

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskEvent<T> extends HttpEvent<T> {
    public readonly task: ITask;

    constructor(task: ITask, context: IHttpContext, data: T) {
        super(context, data);
        this.task = task;
    }
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskNode extends AbstractNode<ITaskOptions> {
    constructor(options: ITaskOptions = {}) {
        super(options);
        options.name = options.name ?? this.constructor.name.toLowerCase();
        options.$asynchrounous = options.$asynchrounous ?? false;
        options.requestMethod = options.requestMethod ?? HttpMethodEnum.POST;
    }

    get type(): string {
        return "task";
    }

    getInstance<T extends Object>(): T {
        return {} as T;
    }

    /**
     * @description no more processessing or children after a task.
     * @override
     */
    get endpoint(): boolean {
        return true;
    }

    /**
     * 
     * @param child 
     * @override
     */
    add(child: AbstractNode<any>): AbstractNode<any> {
        throw GestaeError.toError("Tasks do not supoport child nodes.");
    }
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractTaskableNode<O extends INodeOptions> extends AbstractNode<O> {
    /**
     * @description
     * @param context 
     */
    protected async _beforeInitialize(context: InitializationContext): Promise<void> {
        const _target = this.getInstance();
        if(hasMetadata(_target, TASK_OPTION_KEY)) {
            context.log.debug(`'${_target.constructor.name}' is decorated with @Task(s), applying task node(s) to '${this.name}'.`);
            const _config = getsertMetadata(_target, TASK_OPTION_KEY);
            const _keys = Object.keys(_config);
            context.log.debug(`Creating ${_keys.length} task node(s)...`);
            for(const _key in _config) {
                if(_config.hasOwnProperty(_key)) {
                    const _taskConfig = _config[_key];
                    context.log.debug(`Creating task node '${_taskConfig.name}' and adding it to '${this.name}'.`);
                    const _task = new TaskNode(_taskConfig);
                    this.add(_task);
                }
            }
            context.log.debug(`${_keys.length} task node(s) applied.`);
        }
    }
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnTaskEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: TaskEvent<I>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncTaskEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: TaskEvent<I>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}

/**
 * @description Utility type to infer `void` return type when omitted.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
type InferReturnType<R> = R extends undefined ? void : R;

/**
 * @description Generic `@Task` decorator for synchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
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

        options.name = options.name?.toLowerCase() ?? property.toLowerCase();
        options.requestMethod = options.requestMethod ?? HttpMethodEnum.POST;
        options.$asynchrounous = false;
        options.$method = property;
        options.$overloads = options.$overloads ?? true;

        setTaskMetadata(target, property, options);
    };
}

/**
 * @description Generic `@AsyncTask` decorator for asynchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
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

        options.name = options.name?.toLowerCase() ?? property.toLowerCase();
        options.requestMethod = options.requestMethod ?? HttpMethodEnum.POST;
        options.$asynchrounous = true;
        options.$method = property;
        options.$overloads = options.$overloads ?? true;

        setTaskMetadata(target, property, options);
    };
}


