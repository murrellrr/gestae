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

import { GestaeError } from "../../error/GestaeError";
import { 
    hasClassMetadata, 
    getsertClassMetadata 
} from "../../Gestae";
import { InitializationContext } from "../../app/InitializationContext";
import { AbstractNode } from "../AbstractNode";
import { INodeOptions } from "../INode";
import { IResourceNode } from "../resource/IResourceNode";
import { RESOURCE_NAME } from "../resource/Resource";
import { TASK_METDADATA_KEY, ITaskOptions, TaskMethodType } from "./Task";
import { TaskNode } from "./TaskNode";

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
                    _resourceKey = (this as unknown as IResourceNode).name;

                const _task = new TaskNode(Object, _method, _resourceKey, _taskConfig);
                this.add(_task);
                await _task.initialize(context);
            }
        }
        await super.afterInitialize(context);
    }
}