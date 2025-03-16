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
    GestaeObjectType,
    HttpMethodEnum,
    getsertClassMetadata,
    hasClassMetadata
} from "./Gestae";
import { GestaeError, MethodNotAllowedError } from "./GestaeError";
import { 
    AbstractNode, 
    INodeOptions 
} from "./Node";
import { InitializationContext } from "./ApplicationContext";
import { 
    TaskEvent, 
    TaskEvents 
} from "./TaskEvent";
import { 
    Envelope,
    InferReturnType,
    ITaskNode,
    ITaskOptions, 
    TASK_METDADATA_KEY, 
    TaskMethodType 
} from "./Task";
import { HttpContext, IHttpContext } from "./HttpContext";
import { 
    createEventPathFromNode, 
    createEventRegister 
} from "./GestaeEvent";
import { 
    IResourceNode, 
    RESOURCE_NAME 
} from "./Resource";
import { ResourceNode } from "./ResourceNode";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskNode extends AbstractNode<ITaskOptions> implements ITaskNode {
    protected readonly method:       TaskMethodType<any, any>;
    protected readonly resourceKey?: string;

    constructor(model: GestaeClassType<any>, method: TaskMethodType<any, any>, resourceKey?: string, 
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

    async getResourceValue<T extends {}>(context: IHttpContext, options?: Record<string, any>): Promise<T> {
        if(!this.parent) return {} as T;
        else if(parent instanceof ResourceNode)
            return (this.parent as ResourceNode).getResourceValue<T>(context, options);
        else
            return this.parent.getInstance() as T;
    }

    public async afterInitialize(context: InitializationContext): Promise<void> {
        let _eventName = createEventPathFromNode(this, TaskEvents.Execute.On);
        let _this      = this;
        context.log.debug(`Binding method '${this.parent!.model.name}.${this.options.method}' on action '${this.name}' to event '${_eventName}' for node '${this.name}'.`);
        context.applicationContext.eventQueue.on(_eventName, async (event: TaskEvent<any, any>) => {
            const _target = await event.task.getResourceValue<GestaeObjectType>(event.context);
            event.data.output = await _this.method.call(_target, event.context, event.data.input);
        });
    }

    protected async emitTaskEvent(context: HttpContext, event: string): Promise<InferReturnType<any>> {
        const _envelope = new Envelope(await context.httpRequest.getBody<GestaeObjectType>());
        const _event    = new TaskEvent(this, context, _envelope);
        _event.path     = createEventPathFromNode(this, createEventRegister(TaskEvents.Execute.operation, event));
        await this.emitEvent(context, _event);
        return undefined;
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        if(context.request.method !== HttpMethodEnum.Post)
            throw new MethodNotAllowedError(`Method '${context.request.method}' is not supported on task '${this.name}'.`);

        const _envelope = new Envelope(await context.httpRequest.getBody<GestaeObjectType>());
        context.setValue(this.fullyQualifiedPath, _envelope);

        //await this.emitTaskEvent(context, TaskEvents.before);
    }

    public async onRequest(context: HttpContext): Promise<void> {
        //await this.emitTaskEvent(context, TaskEvents.on);
        // TODO: get from context session and send the envelope output to the response.
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        //await this.emitTaskEvent(context, TaskEvents.after);
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
    public async afterInitialize(context: InitializationContext): Promise<void> {
        if(hasClassMetadata(this.model, TASK_METDADATA_KEY)) {
            const _metadata = getsertClassMetadata(this.model, TASK_METDADATA_KEY);
            for(const _key in _metadata) {
                const _taskConfig = _metadata[_key] as ITaskOptions;
                context.log.debug(`${this.constructor.name} '${this.name}' adding task '${_taskConfig.name}' to children.`);
                
                // Get the method.
                let _method = this.model.prototype[_taskConfig.method!] as TaskMethodType<any, any>;
                if(!_method) 
                    throw new GestaeError(`Task method '${_taskConfig.method}' not found on '${this.model.name}'.`);
                
                let _resourceKey;
                if(RESOURCE_NAME === this.type)
                    _resourceKey = (this as unknown as IResourceNode).resourceKey;

                const _task = new TaskNode(Object, _method, _resourceKey, _taskConfig);
                this.add(_task);
                await _task.initialize(context);
            }
        }
        await super.afterInitialize(context);
    }
}
