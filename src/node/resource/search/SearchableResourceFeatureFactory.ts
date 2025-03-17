import { GestaeError } from "../../../error/GestaeError";
import { createEventPathFromNode } from "../../../events/GestaeEvent";
import { 
    hasClassMetadata, 
    getsertClassMetadata 
} from "../../../Gestae";
import { AbstractFeatureFactoryChain } from "../../../node/AbstractFeatureFactoryChain";
import { AbstractNode } from "../../../node/AbstractNode";
import { ResourceEvents } from "../ResourceEvent";
import { ResourceNode } from "../ResourceNode";
import { 
    SEARCH_METADATA_KEY, 
    ISearchOptions, 
    SearchResourceFunctionType 
} from "./Search";
import { SearchEvent } from "./SearchEvent";
import { makeResourceSearchable } from "./SearchHandler";

export class SearchableResourceFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory(node: AbstractNode<any>): boolean {
        return hasClassMetadata(node.model, SEARCH_METADATA_KEY);
    }

    onApply(node: ResourceNode): void {
        const _metadata: ISearchOptions = getsertClassMetadata(node.model, SEARCH_METADATA_KEY);

        // check to see if the target implements the search method.
        if(!node.model.prototype[_metadata.method!]) 
            throw new Error(`Search resource method '${node.model.name}.${_metadata.method}' not implemented.`);
        makeResourceSearchable(node, _metadata);

        const _method = node.model.prototype[_metadata.method!] as SearchResourceFunctionType<any>;
        if(!_method) 
            throw new GestaeError(`Method '${_metadata.method}' not found on '${node.model.name}'.`);

        const _eventName = createEventPathFromNode(node, ResourceEvents.Search.On);

        //Binding method 'Employee.onRead' on action 'read' to event 'gestaejs:resource:my:test:root:api:busniess:company:people:labor:employee:read:on' for node 'employee'.
        this.log.debug(`Binding method '${node.model.constructor.name}.${_metadata.method}' on action 'search' to event '${_eventName}' for node '${node.name}'`);
        this.context.eventQueue.on(_eventName, async (event: SearchEvent<any>): Promise<void> => {
                                         await _method(event.context, event.request, event.data);
                                    });
    }
}