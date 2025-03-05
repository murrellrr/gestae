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
    HttpMethodEnum,
    getsertMetadata,
    hasMetadata
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { 
    AbstractNode, 
    INodeOptions 
} from "./Node";
import { InitializationContext } from "./ApplicationContext";
import { ITaskOptions } from "./TaskEvent";
import { TASK_OPTION_KEY } from "./Task";

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
