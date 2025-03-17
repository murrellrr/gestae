import { GestaeError } from "../../../error/GestaeError";
import { HttpMethodEnum } from "../../../http/HTTP";
import { HttpContext } from "../../../http/HttpContext";
import { ResourceEvents } from "../ResourceEvent";
import { ResourceNode } from "../ResourceNode";
import { 
    ISearchOptions, 
    DEFAULT_SEARCH_NAME 
} from "./Search";
import { emitSearchEvent } from "./SearchEvent";
import { SearchRequest } from "./SearchRequest";
import { SearchResponse } from "./SearchResponse";


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