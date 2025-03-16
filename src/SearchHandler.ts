import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { 
    getsertClassMetadata, 
    hasClassMetadata, 
    HttpMethodEnum 
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { createEventPathFromNode } from "./GestaeEvent";
import { HttpContext } from "./HttpContext";
import { AbstractNode } from "./Node";
import { ResourceEvents } from "./ResourceEvent";
import { ResourceNode } from "./ResourceNode";
import { 
    DEFAULT_SEARCH_NAME, 
    ISearchOptions, 
    SEARCH_METADATA_KEY, 
    SearchRequest, 
    SearchResourceFunctionType, 
    SearchResponse
} from "./Search";
import { 
    emitSearchEvent, 
    SearchEvent 
} from "./SearchEvent";

interface ISearchContext {
    searchRequest:  SearchRequest;
    searchResponse: SearchResponse<any>;
}

/**
 * @description
 * @param source 
 * @param options 
 * @returns 
 */
export const makeResourceSearchable = (source: ResourceNode, options: ISearchOptions = {}): void => {
    // binding the source functions to be wrapped.
    const _originBeforeRequest = source.beforeRequest.bind(source);
    const _originOnRequest     = source.onRequest.bind(source);
    const _originAfterRequest  = source.afterRequest.bind(source);

    const _pathName   = options.pathName ?? DEFAULT_SEARCH_NAME;
    const _contextKey = `${source.fullyQualifiedPath}:${_pathName}`;

    // wrapping source functions
    source.beforeRequest = async (context: HttpContext) => {
        if(context.request.uriTree.peek === _pathName && (context.request.isMethod(HttpMethodEnum.Get) || 
                                                          context.request.isMethod(HttpMethodEnum.Post))) {
            // We are the search request, performing the pre-search operations.
            context.request.uriTree.next; //NOSONAR: advance past the search keyword leaf on the tree.
            // we do this to prevent upstream processesing think there are still leafs to process.

            const _searchContext: ISearchContext = {
                searchRequest: SearchRequest.create(context.httpRequest),
                searchResponse: new SearchResponse<any>()
            };
            context.setValue(_contextKey, _searchContext);

            // Fire the before events.
            return new Promise((resolve, reject) => { // returning promise so that error handling makes it back to the wrapped resource.
                emitSearchEvent(source, context, ResourceEvents.Search.OnBefore, _searchContext.searchRequest, 
                                _searchContext.searchResponse)
                    .then((response: SearchResponse<any>) => {
                        _searchContext.searchResponse = response;
                        resolve();
                    })
                    .catch((error: any) => {
                        context.log.error(`Error in search ${source.constructor.name} ${source.name}.beforeRequest event: ${error}`);
                        reject(GestaeError.toError(error));
                    });
            });
        }
        else
            return _originBeforeRequest(context);
    };

    source.onRequest = async (context: HttpContext) => {
        // check to see if this is a search request.
        const _searchContext: ISearchContext = context.getValue<ISearchContext>(_contextKey);
        if(_searchContext) {
            return new Promise((resolve, reject) => { // returning promise so that error handling makes it back to the wrapped resource.
                emitSearchEvent(source, context, ResourceEvents.Search.On, _searchContext.searchRequest, 
                                _searchContext.searchResponse)
                    .then((response: SearchResponse<any>) => {
                        _searchContext.searchResponse = response;
                        context.response.send(response); // Prepare the response.
                        resolve();
                    })
                    .catch((error: any) => {
                        context.log.error(`Error in search ${source.constructor.name} ${source.name}.onRequest event: ${error}`);
                        reject(GestaeError.toError(error));
                    });
            });
        }
        else 
            return _originOnRequest(context);
    };

    source.afterRequest = async (context: HttpContext) => {
        // check to see if this is a search request.
        const _searchContext: ISearchContext = context.getValue<ISearchContext>(_contextKey);
        if(_searchContext) {
            return new Promise((resolve, reject) => { // returning promise so that error handling makes it back to the wrapped resource.
                emitSearchEvent(source, context, ResourceEvents.Search.On, _searchContext.searchRequest, 
                                _searchContext.searchResponse)
                    .then((response: SearchResponse<any>) => {
                        _searchContext.searchResponse = response;
                        resolve();
                    })
                    .catch((error: any) => {
                        context.log.error(`Error in search ${source.constructor.name} ${source.name}.afterRequest event: ${error}`);
                        reject(GestaeError.toError(error));
                    });
            });
        }
        else 
            return _originAfterRequest(context);
    };
};

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