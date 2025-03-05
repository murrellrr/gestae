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

import { INode } from "./Node";
import { 
    IOptions, 
    HttpMethodEnum
} from "./Gestae";
import { 
    EventRegisterType,
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { 
    IHttpContext 
} from "./HttpContext";

/**
 * @description Options for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ITaskOptions extends IOptions {
    name?: string;
    requestMethod?: HttpMethodEnum;
    dataAsTarget?: boolean;
    $method?: string;
    $asynchrounous?: boolean;
};

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ITaskNode extends INode {
    getTakOptions(): ITaskOptions;
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const TaskEvents = {
    Execute: {
        OnBefore: {operation: "execute", action: "before"} as EventRegisterType,
        On:       {operation: "execute", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "execute", action: "after" } as EventRegisterType,
    },
    Error: {
        OnBefore: {operation: "error", action: "before"} as EventRegisterType,
        On:       {operation: "error", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "error", action: "after" } as EventRegisterType,
    }
};

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskEvent<T> extends HttpEvent<T> {
    public readonly task: ITaskNode;

    constructor(task: ITaskNode, context: IHttpContext, data: T) {
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
export function OnTaskEvent<I>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: TaskEvent<I>) => void>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
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
        options.dataAsTarget = options.dataAsTarget ?? true;
        setEventConfig(target, event, property, options);
    };
}