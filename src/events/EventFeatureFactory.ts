
import { 
    hasClassMetadata, 
    getsertClassMetadata 
} from "../Gestae";
import { GestaeError } from "../error/GestaeError";
import { AbstractFeatureFactoryChain } from "../node/AbstractFeatureFactoryChain";
import { AbstractNode } from "../node/AbstractNode";
import { 
    createEventPathFromNode, 
    EVENT_OPTIONS_KEY, 
    GestaeEvent 
} from "./GestaeEvent";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class EventFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory(node: AbstractNode<any>): boolean {
        return hasClassMetadata(node.model, EVENT_OPTIONS_KEY);
    }

    onApply(node: AbstractNode<any>): void {
        const _metadata = getsertClassMetadata(node.model, EVENT_OPTIONS_KEY);
        for(const _key in _metadata) {
            const _eventsMetadata = _metadata[_key];
            for(const _eventMetadata of _eventsMetadata) {
                const _fullyQualifiedEventPath = `${createEventPathFromNode(node, _eventMetadata.register)}`;
                const _method = node.model.prototype[_eventMetadata.register.method] as (event: GestaeEvent) => void | Promise<void>;

                // Check Method.
                if(!_method) 
                    throw GestaeError.toError(`Method '${node.model.name}.${_eventMetadata.register.method}' not implemented.'`);

                this.context.eventQueue.on(_fullyQualifiedEventPath, 
                                            _method, 
                                            _eventMetadata.once);
                this.log.debug(`Binding method '${node.model.name}.${_eventMetadata.register.method}' on action '${_eventMetadata.register.action}' to event '${_fullyQualifiedEventPath}' for node '${node.name}'.`);
            }
        }
    }
}