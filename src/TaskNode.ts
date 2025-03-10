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
    ClassType,
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
import { TaskEvent, TaskEvents } from "./TaskEvent";
import { 
    ITaskOptions, 
    TASK_METDADATA_KEY, 
    TaskMethodType 
} from "./Task";
import { HttpContext } from "./HttpContext";
import { createEventPathFromNode } from "./GestaeEvent";
import { ResourceNode } from "./ResourceNode";

const RESOURCE_NODE_NAME = "resource";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TaskNode extends AbstractNode<ITaskOptions> {
    constructor(model: ClassType<any>, options: ITaskOptions = {}) {
        super(model, options);
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

    /**
     * 
     * @param child 
     * @override
     */
    add(child: AbstractNode<any>): AbstractNode<any> {
        throw GestaeError.toError("Tasks do not supoport child nodes.");
    }

    public async beforeInitialize(context: InitializationContext): Promise<void> {
        let _eventName = createEventPathFromNode(this, TaskEvents.Execute.On, this.name);
        let _this = this;
        context.applicationContext.eventQueue.on(_eventName, async (event: TaskEvent<any, any>) => {
            event.data.output = await _this.options.$method!.call(event.data.input, event.data, event.context);
        });
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        //
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
    public async beforeInitialize(context: InitializationContext): Promise<void> {
        await super.beforeInitialize(context);
        if(hasClassMetadata(this.model, TASK_METDADATA_KEY)) {
            const _metadata = getsertClassMetadata(this.model, TASK_METDADATA_KEY);
            for(const _key in _metadata) {
                const _taskConfig = _metadata[_key] as ITaskOptions;
                context.log.debug(`${this.constructor.name} '${this.name}' adding task '${_taskConfig.name}' to children.`);
                
                // Get the method.
                _taskConfig.$method = this.model.prototype[_taskConfig.method!] as TaskMethodType;
                    if(!_taskConfig.$method) 
                        throw new GestaeError(`Task method '${_taskConfig.method}' not found on '${this.model.name}'.`);

                if(RESOURCE_NODE_NAME === this.type) {
                    _taskConfig.resourceKey = (this as unknown as ResourceNode).resourceKey;
                }

                const _task = new TaskNode(this.model, _taskConfig);
                this.add(_task);
            }
        }
    }
}
