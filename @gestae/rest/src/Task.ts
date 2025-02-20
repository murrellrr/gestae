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
    IEventRegister, 
    validateAndSetTypedEventMetaData 
} from "./Gestae";
import { HttpEvent } from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";

const TASK_KEY = Symbol("task");
const TASK_HANDLERS_KEY = Symbol("task_handlers");

export const TaskEvents = {
    Execute: {
        OnBefore: {operation: "execute", action: "before"},
        On:       {operation: "execute", action: "on"},
        OnAfter:  {operation: "execute", action: "after"},
        OnError:  {operation: "execute", action: "error"}
    },
    Enqueue: {
        OnBefore: {operation: "enqueue", action: "before"},
        On:       {operation: "enqueue", action: "on"},
        OnAfter:  {operation: "enqueue", action: "after"},
        OnError:  {operation: "enqueue", action: "error"}
    },
    Status: {
        OnBefore: {operation: "status", action: "before"},
        On:       {operation: "status", action: "on"},
        OnAfter:  {operation: "status", action: "after"}
    },
};

export enum TaskStatus {
    Completed = "completed",
    Failed = "failed",
    Cancelled = "cancelled",
    Timeout = "timeout",
    Retried = "retried",
    Unknown = "unknown"
}

export class TaskEvent<I, O> extends HttpEvent<I> {
    public readonly synchronous: boolean = false;
    public status: TaskStatus = TaskStatus.Unknown;
    public output: O = {} as O;

    constructor(context: IHttpContext, data: I) {
        super(context, data);
    }
}

type TaskEventHandler<I, O> = (event: TaskEvent<I, O>) => Promise<void>;



export function OnTaskEvent<I, O>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                     descriptor: TypedPropertyDescriptor<(event: TaskEvent<I, O>) => void>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}

export function OnAsyncTaskEvent<I, O>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                        descriptor: TypedPropertyDescriptor<(event: TaskEvent<I, O>) => Promise<void>>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}