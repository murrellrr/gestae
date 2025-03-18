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