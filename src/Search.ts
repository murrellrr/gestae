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

import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { 
    getsertMetadata, 
    hasMetadata, 
    HttpMethodEnum 
} from "./Gestae";
import { formatEvent } from "./GestaeEvent";
import { 
    HttpContext, 
    IHttpContext 
} from "./HttpContext";
import { HttpRequest } from "./HttpRequest";
import { AbstractNode } from "./Node";
import { 
    ResourceEvent, 
    ResourceEvents 
} from "./ResourceEvent";
import { ResourceNode } from "./ResourceNode";
import { SearchParams } from "./SearchParams";
import { ITaskOptions } from "./TaskEvent";

export const SEARCH_OPTION_KEY   = "gestaejs:search";
const        DEFAULT_SEARCH_NAME = "search";

interface SearchResourceContext {
    searchRequest: SearchRequest<any>;
    searchEvent:   ResourceEvent<any>;
}

export interface ISearchOptions extends ITaskOptions {
    pathName?: string;
    method?:   string;
};

/**
 * @description Resource Search result.
 * @abstract
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractSearchResult {
    constructor(
        public readonly id:    string,
        public readonly path?: string
    ) {}
}

/**
 * @description Resource search response.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchResponse<R extends AbstractSearchResult> {
    protected _data:    R[]    = [];
    protected _count:   number = 0;
    public    total:    number = 0;
    public    page:     number = 0;
    public    pageSize: number = 0;

    constructor(data: R[] = [], page?: number, pageSize?: number, total?: number) {
        this._data    = data;
        this._count   = data.length;
        this.total    = total ?? this._count;
        this.page     = page ?? 0;
        this.pageSize = pageSize ?? this._count;
    }

    get count(): number {
        return this._count;
    }

    get data(): R[] {
        return this._data;
    }

    set data(data: R[]) {
        this._data = data;
        this._count = data.length;
        // Check the totals too
    }

    add(result: R) {
        this._data.push(result);
        this._count = this._data.length;
    }

    /**
     * @description Properly formats the encapsulated data to a public structure.
     * @returns Public JSON object.
     */
    toJSON(): any {
        return {
            data:     this._data,
            total:    this.total,
            page:     this.page,
            pageSize: this.pageSize,
            count:    this._count
        };
    }

    *[Symbol.iterator](): Iterator<R> {
        for (const item of this._data) {
            yield item;
        }
    }
}

/**
 * @description Resource search request.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchRequest<R extends AbstractSearchResult> {
    public response: SearchResponse<R>;

    constructor(
        public readonly page:      number,
        public readonly pageSize:  number,
        public readonly filter:    SearchParams,
        response?: SearchResponse<R>
    ) {
        this.response = response ?? new SearchResponse<R>();
    }

    static create<R extends AbstractSearchResult>(request: HttpRequest): SearchRequest<R> {
        return new SearchRequest(request.searchParams.getNumber("page", 1)!, 
                                 request.searchParams.getNumber("pageSize", 10)!, 
                                 request.searchParams);
    }
}

export class SearchableResourceFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory<T extends Object>(node: AbstractNode<any>, target: T): boolean {
        return hasMetadata(target, SEARCH_OPTION_KEY);
    }

    onApply<T extends Object>(node: ResourceNode, target: T): void {
        const _metatdata: ISearchOptions = getsertMetadata(target, SEARCH_OPTION_KEY);
        this.log.debug(`${node.constructor.name} '${node.name}' decorated with @<sync>SearchResource, adding virtual search node '${_metatdata.pathName}'.`);

        // check to see if the target implements the search method.
        if(!(target as any)[_metatdata.method!]) 
            throw new Error(`@SearchResource method '${_metatdata.method}' not implemented in '${target.constructor.name}'.`);
        makeResourceSearchable(node, _metatdata);
        
        const _method    = (target as any)[_metatdata.method!] as (firstArg: SearchRequest<any>, context: IHttpContext) => void;
        const _eventName = `${node.fullyQualifiedPath}:${formatEvent(ResourceEvents.Search.On)}`;
        this.log.debug(`Binding search event '${_eventName}' to method '${_metatdata.method}' on target '${target.constructor.name}'.`);
        this.context.eventQueue.on(_eventName, async (event: ResourceEvent<SearchRequest<any>>): Promise<void> => {
                                        return _method(event.data!, event.context);
                                    });
    }
}

export const setSearchMetadata = <T extends Object>(target: T, property: string, options: ISearchOptions = {}) => {
    let _target = getsertMetadata(target, SEARCH_OPTION_KEY, options);
    _target.pathName      = options.pathName ?? DEFAULT_SEARCH_NAME;
    _target.requestMethod = options.requestMethod ?? HttpMethodEnum.Get;
    _target.method        = property;
};

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
    const _contextKey = `${_pathName}:${source.resourceKey}`;

    // wrapping source functions
    source.beforeRequest = async (context: HttpContext) => {
        context.log.debug(`${source.name} Search Proxy peeking path name ${context.request.uri.peek}`);
        if(context.request.uri.peek === _pathName && (context.request.isMethod(HttpMethodEnum.Get) || 
                                                      context.request.isMethod(HttpMethodEnum.Post))) {
            // We are the search request, performing the pre-search operations.
            let _consumedPath = context.request.uri.next;
            context.log.debug(`'Virtual search node ${_pathName}' is a match for uri node '${_consumedPath}', emitting OnBefore search events.`);

            const _searchRequest = SearchRequest.create(context._request);
            const _context: SearchResourceContext = {
                searchRequest: _searchRequest,
                searchEvent:   new ResourceEvent<any>(context, source)
            }
            context.setValue(_contextKey, _context);
            context.resources.setResource(source.resourceKey, _searchRequest);

            // Fire the before events.
            await source.emitResourceEvent(context, _context.searchEvent, ResourceEvents.Search.OnBefore);
        }
        else
            return _originBeforeRequest(context);
    };

    source.onRequest = async (context: HttpContext) => {
        // check to see if this is a search request.
        const _context = context.getValue<SearchResourceContext>(_contextKey);
        if(_context){
            context.log.debug(`${source.name} search proxy emitting On search events.`);
            await source.emitResourceEvent(context, _context.searchEvent, ResourceEvents.Search.On);
        }
        else 
            return _originOnRequest(context);
    };

    source.afterRequest = async (context: HttpContext) => {
        // check to see if this is a search request.
        const _context = context.getValue<SearchResourceContext>(_contextKey);
        if(_context){
            context.log.debug(`${source.name} search proxy emitting OnAfter search events.`);
            await source.emitResourceEvent(context, _context.searchEvent, ResourceEvents.Search.OnAfter);
            context.response.send(_context.searchRequest.response);
        }
        else 
            return _originAfterRequest(context);
    };
};


/**
 * @description `@Search` decorator for synchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function SearchResource<S extends AbstractSearchResult>(options: ISearchOptions = {}) {
                                                               options.dataAsTarget = options.dataAsTarget ?? true;
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<(firstArg: SearchRequest<S>, context: HttpContext) => void>) {
        setSearchMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @description `@Search` decorator for synchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function AsyncSearchResource<S extends AbstractSearchResult>(options: ISearchOptions = {}) {
                                                                    options.dataAsTarget = options.dataAsTarget ?? true;
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<(firstArg: SearchRequest<S>, context: HttpContext) => Promise<void>>) {
        setSearchMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.