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
                    _resourceKey = (this as unknown as IResourceNode).resourceKey;

                const _task = new TaskNode(Object, _method, _resourceKey, _taskConfig);
                this.add(_task);
                await _task.initialize(context);
            }
        }
        await super.afterInitialize(context);
    }
}