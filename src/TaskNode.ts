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
    HttpMethodEnum,
    getsertClassMetadata,
    hasClassMetadata
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { 
    AbstractNode, 
    INodeOptions 
} from "./Node";
import { InitializationContext } from "./ApplicationContext";
import { 
    ITaskNode,
    TaskEvent, 
    TaskEvents 
} from "./TaskEvent";
import { 
    Envelope,
    ITaskOptions, 
    TASK_METDADATA_KEY, 
    TaskMethodType 
} from "./Task";
import { HttpContext } from "./HttpContext";
import { createEventPathFromNode } from "./GestaeEvent";
import { 
    IResourceNode, 
    RESOURCE_NAME 
} from "./Resource";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskNode extends AbstractNode<ITaskOptions> implements ITaskNode {
    protected readonly method:       TaskMethodType;
    protected readonly resourceKey?: string;

    constructor(model: GestaeClassType<any>, method: TaskMethodType, resourceKey?: string, 
                options: ITaskOptions = {}, ) {
        super(model, options);
        this.method            = method;
        this.resourceKey       = resourceKey;
        options.name           = options.name ?? this.constructor.name.toLowerCase();
        options.$asynchrounous = options.$asynchrounous ?? false;
        options.requestMethod  = options.requestMethod ?? HttpMethodEnum.Post;
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

    getTakOptions(): ITaskOptions {
        return this.options;
    }

    /**
     * 
     * @param child 
     * @override
     */
    add(child: AbstractNode<any>): AbstractNode<any> {
        throw GestaeError.toError("Tasks do not supoport child nodes.");
    }

    public async afterInitialize(context: InitializationContext): Promise<void> {
        let _eventName = createEventPathFromNode(this, TaskEvents.Execute.On);
        let _this      = this;
        context.log.debug(`Binding method '${this.parent!.model.name}.${this.options.method}' on action '${this.name}' to event '${_eventName}' for node '${this.name}'.`);
        // context.applicationContext.eventQueue.on(_eventName, async (event: TaskEvent<any, any>) => {
        //     let _target;
        //     // if(_this.resourceKey)
        //     //     event.context.resources.getResource(_this.resourceKey);
        //     if(!_target)
        //         _target = _this.getInstance();
        //     //event.data.output = await _this.method.call(_target, event.data.input, event.context);
        // });
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        const _envelope = new Envelope(await context.httpRequest.getBody<Object>());
        const _event    = new TaskEvent(this, context, _envelope);
        //_event.path     = createEventPathFromNode(this, TaskEvents.Execute.OnBefore);
        //await this.emitEvent(context, _event);
    }

    public async onRequest(context: HttpContext): Promise<void> {
        //
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        //
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
                let _method = this.model.prototype[_taskConfig.method!] as TaskMethodType;
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
