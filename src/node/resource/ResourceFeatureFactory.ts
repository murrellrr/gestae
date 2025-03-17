import { GestaeError } from "../../error/GestaeError";
import { 
    createEventPathFromNode, 
    EventRegisterType 
} from "../../events/GestaeEvent";
import { 
    hasClassMetadata, 
    getsertClassMetadata 
} from "../../Gestae";
import { AbstractFeatureFactoryChain } from "../AbstractFeatureFactoryChain";
import { ResourceActionEnum } from "./Resource";
import { 
    handleCreateEvent, 
    handleDeleteEvent, 
    handleReadEvent, 
    handleUpdateEvent, 
    ResourceEventHandlerType, 
    ResourceFunctionType, 
    RESOUREC_ACTION_METADATA_KEY 
} from "./ResourceActions";
import { 
    ResourceEvent, 
    ResourceEvents 
} from "./ResourceEvent";
import { ResourceNode } from "./ResourceNode";

export class ResourceFeatureFactory extends AbstractFeatureFactoryChain<ResourceNode> {
    isFeatureFactory(node: ResourceNode): boolean {
        return hasClassMetadata(node.model, RESOUREC_ACTION_METADATA_KEY);
    }

    onApply(node: ResourceNode): void {
        const _metadata = getsertClassMetadata(node.model, RESOUREC_ACTION_METADATA_KEY);
        for(const _action in _metadata) {
            const _actionMetadata = _metadata[_action];

            // Get the method.
            let _method: ResourceFunctionType = node.model.prototype[_actionMetadata.method];
            if(!_method) 
                throw new GestaeError(`Method '${_actionMetadata.method}' not found on '${node.model.constructor.name}'.`);

            const _event     = ResourceFeatureFactory.getResourceEvent(_actionMetadata.action);
            const _eventName = createEventPathFromNode(node, _event);
            const _handler   = ResourceFeatureFactory.getEventHandler(_actionMetadata.action);

            this.log.debug(`Binding method '${node.model.name}.${_actionMetadata.method}' on action '${_action}' to event '${_eventName}' for node '${node.name}'.`);
            this.context.eventQueue.on(_eventName, async (event: ResourceEvent) => {
                try {
                    //if(!event.data) throw new GestaeError(`ResourceEvent must have data.`); // Defensive coding.
                    await _handler(event, _method);
                }
                catch(error) {
                    event.context.log.error(`Error in resource event handler: ${error}`);
                    event.cancel(GestaeError.toError(error));
                }
            });
        }
    }

    static getEventHandler(action: ResourceActionEnum): ResourceEventHandlerType {
        switch(action) {    
            case ResourceActionEnum.Create: 
                return handleCreateEvent as ResourceEventHandlerType;
            case ResourceActionEnum.Read: 
                return handleReadEvent as ResourceEventHandlerType;
            case ResourceActionEnum.Update: 
                return handleUpdateEvent as ResourceEventHandlerType;
            case ResourceActionEnum.Delete: 
                return handleDeleteEvent as ResourceEventHandlerType;
            default: 
                throw new GestaeError(`Action '${action}' not supported.`);
        }
    }

    static getResourceEvent(action: ResourceActionEnum): EventRegisterType {
        switch(action) {
            case ResourceActionEnum.Create: 
                return ResourceEvents.Create.On;
            case ResourceActionEnum.Read: 
                return ResourceEvents.Read.On;
            case ResourceActionEnum.Update: 
                return ResourceEvents.Update.On;
            case ResourceActionEnum.Delete: 
                return ResourceEvents.Delete.On;
            default: 
                throw new GestaeError(`Action '${action}' not supported.`);
        }
    }
}