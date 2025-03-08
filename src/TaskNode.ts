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
    getsertMetadata,
    hasClassMetadata,
    hasMetadata
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { 
    AbstractNode, 
    INodeOptions 
} from "./Node";
import { InitializationContext } from "./ApplicationContext";
import { ITaskOptions } from "./TaskEvent";
import { TASK_METDADATA_KEY } from "./Task";

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
            const _keys = Object.keys(_metadata);
            for(const _key in _metadata) {
                if(_metadata.hasOwnProperty(_key)) {
                    const _taskConfig = _metadata[_key];
                    context.log.debug(`${this.constructor.name} '${this.name}' adding task '${_taskConfig.name}' to children.`);
                    const _task = new TaskNode(_taskConfig);
                    this.add(_task);
                }
            }
        }
    }
}
