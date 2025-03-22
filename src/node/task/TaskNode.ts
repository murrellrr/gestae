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
    GestaeClassType,
    GestaeObjectType
} from "../../Gestae";
import { GestaeError, InternalServerError } from "../../error/GestaeError";
import { MethodNotAllowedError } from "../../error/MethodNotAllowedError";
import { AbstractNode, } from "../AbstractNode";
import { InitializationContext } from "../../application/InitializationContext";
import { 
    TaskEvent, 
    TaskEvents 
} from "./TaskEvent";
import { 
    ITaskOptions, 
    TaskMethodType 
} from "./Task";
import { IHttpContext } from "../../http/IHttpContext";
import { HttpContext } from "../../http/HttpContext";
import { 
    createEventPathFromNode, 
    createEventRegister 
} from "../../events/GestaeEvent";
import { 
    RESOURCE_NAME 
} from "../resource/Resource";
import { IResourceNode } from "../resource/IResourceNode";
import { HttpMethodEnum } from "../../http/HTTP";
import { ITaskNode } from "./ITaskNode";
import { Envelope } from "./Envelope";

const TASK_ENVELOPE_KEY = "taskenvelope";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskNode extends AbstractNode<ITaskOptions> implements ITaskNode {
    protected readonly method:       TaskMethodType<any, any> | undefined;
    protected readonly resourceKey?: string;

    constructor(model: GestaeClassType<any>, method?: TaskMethodType<any, any>, resourceKey?: string, 
                options: ITaskOptions = {}, ) {
        super(model, options);
        this.method            = method;
        options.name           = options.name           ?? this.constructor.name.toLowerCase();
        options.$asynchrounous = options.$asynchrounous ?? false;
    }

    get type(): string {
        return "task";
    }

    /**
     * @description no more processessing of children after a task.
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

    async getResourceValue<T extends {}>(context: IHttpContext, options?: Record<string, any>): Promise<T> {
        if(!this.parent) return {} as T;
        else if(this.parent.type === RESOURCE_NAME)
            return (this.parent as unknown as IResourceNode).getResourceValue<T>(context, options);
        else
            return this.parent.getInstance();
    }

    public async afterInitialize(context: InitializationContext): Promise<void> {
        if(this.method) {
            let _eventName = createEventPathFromNode(this, TaskEvents.Execute.On);
            let _this      = this;
            context.log.debug(
                `Binding method '${this.parent!.model.name}.${this.options.method}' on action '${this.name}' to event '${_eventName}' for node '${this.name}'.`
            );
            context.applicationContext.eventQueue.on(_eventName, async (event: TaskEvent<any, any>) => {
                const _target = await event.task.getResourceValue<GestaeObjectType>(event.context);
                event.data.output = await _this.method!.call(_target, event.context, event.data.input);
            });
        }   
    }

    protected async emitTaskEvent(context: HttpContext, envelope: Envelope<any, any>, event: string): Promise<void> {
        const _event = new TaskEvent(this, context, envelope, 
            createEventPathFromNode(this, 
                createEventRegister(TaskEvents.Execute.operation, event)));
        await this.emitEvent(context, _event);
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        if(context.request.method !== HttpMethodEnum.Post)
            throw new MethodNotAllowedError(`Method '${context.request.method}' is not supported on task '${this.name}'.`);

        const _envelope = new Envelope(await context.httpRequest.getBody<GestaeObjectType>());
        context.setValue(`${this.fullyQualifiedPath}:${TASK_ENVELOPE_KEY}`, _envelope);

        await this.emitTaskEvent(context, _envelope, TaskEvents.before);
    }

    public async onRequest(context: HttpContext): Promise<void> {
        const _envelope = context.getValue<Envelope<any, any>>(`${this.fullyQualifiedPath}:${TASK_ENVELOPE_KEY}`);
        if(!_envelope) // defensive coding
            throw new InternalServerError(`Task Envelop not found for '${this.constructor.name}' '${this.name}'.`);
        await this.emitTaskEvent(context, _envelope, TaskEvents.on);
        context.response.send(_envelope.output); // send the output of the task to the client
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        const _envelope = context.getValue<Envelope<any, any>>(`${this.fullyQualifiedPath}:${TASK_ENVELOPE_KEY}`);
        if(!_envelope) // defensive coding
            throw new InternalServerError(`Task Envelop not found for '${this.constructor.name}' '${this.name}'.`);
        await this.emitTaskEvent(context, _envelope, TaskEvents.after);
    }
}


