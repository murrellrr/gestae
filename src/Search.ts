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
    getsertClassMetadata,
    getsertObjectMetadata, 
    hasClassMetadata,  
    HttpMethodEnum, 
    IOptions
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { createEventPathFromNode } from "./GestaeEvent";
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

export const SEARCH_METADATA_KEY = "gestaejs:search";
const        DEFAULT_SEARCH_NAME = "search";

interface SearchResourceContext {
    searchRequest: SearchRequest<any>;
    searchEvent:   ResourceEvent<any>;
}

export interface ISearchOptions extends IOptions {
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
    isFeatureFactory(node: AbstractNode<any>): boolean {
        return hasClassMetadata(node.model, SEARCH_METADATA_KEY);
    }

    onApply(node: ResourceNode): void {
        const _metadata: ISearchOptions = getsertClassMetadata(node.model, SEARCH_METADATA_KEY);

        // check to see if the target implements the search method.
        if(!node.model.prototype[_metadata.method!]) 
            throw new Error(`Search resource method '${node.model.name}.${_metadata.method}' not implemented.`);
        makeResourceSearchable(node, _metadata);

        const _method = node.model.prototype[_metadata.method!] as (firstArg: SearchRequest<any>, context: IHttpContext) => void;
        if(!_method) 
            throw new GestaeError(`Method '${_metadata.method}' not found on '${node.model.name}'.`);

        const _eventName = `${createEventPathFromNode(node, ResourceEvents.Search.On)}`;

        //Binding method 'Employee.onRead' on action 'read' to event 'gestaejs:resource:my:test:root:api:busniess:company:people:labor:employee:read:on' for node 'employee'.
        this.log.debug(`Binding method '${node.model.constructor.name}.${_metadata.method}' on action 'search' to event '${_eventName}' for node '${node.name}'`);
        this.context.eventQueue.on(_eventName, async (event: ResourceEvent<SearchRequest<any>>): Promise<void> => {
                                        return _method(event.data, event.context);
                                    });
    }
}

export const setSearchMetadata = <T extends Object>(target: T, property: string, options: ISearchOptions = {}) => {
    let _target = getsertObjectMetadata(target, SEARCH_METADATA_KEY, options);
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
        if(context.request.uriTree.peek === _pathName && (context.request.isMethod(HttpMethodEnum.Get) || 
                                                          context.request.isMethod(HttpMethodEnum.Post))) {
            // We are the search request, performing the pre-search operations.
            context.request.uriTree.next; //NOSONAR: advance past the search keyword leaf on the tree.
            // we do this to prevent upstream processesing think there are still leafs to process.

            const _searchRequest = SearchRequest.create(context._request);
            context.resources.setResource(source.resourceKey, _searchRequest);
            context.setValue(_contextKey, true);

            // Fire the before events.
            await source.emitResourceEvent(context, ResourceEvents.Search.OnBefore);
        }
        else
            return _originBeforeRequest(context);
    };

    source.onRequest = async (context: HttpContext) => {
        // check to see if this is a search request.
        if(context.getValue<boolean>(_contextKey))
            await source.emitResourceEvent(context, ResourceEvents.Search.On);
        else 
            return _originOnRequest(context);
    };

    source.afterRequest = async (context: HttpContext) => {
        // check to see if this is a search request.
        const _searchRequest = context.resources.getResource<SearchRequest<any>>(source.resourceKey);
        if(context.getValue<boolean>(_contextKey)) {
            await source.emitResourceEvent(context, ResourceEvents.Search.OnAfter);
            context.response.send(_searchRequest.response);
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
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<(firstArg: SearchRequest<S>, context: HttpContext) => Promise<void>>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setSearchMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.