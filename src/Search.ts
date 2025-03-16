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

import { 
    getsertObjectMetadata, 
    HttpMethodEnum, 
    IOptions
} from "./Gestae";
import { IHttpContext } from "./HttpContext";
import { HttpRequest } from "./HttpRequest";
import { SearchParams } from "./SearchParams";

export const SEARCH_METADATA_KEY = "gestaejs:search";
export const DEFAULT_SEARCH_NAME = "search";

/**
 * @description Search Function Type for resources. This function enforces a pagable request/response type for search.
 *              Note: Because no resource is resolved when search is invoked, 'this' keyword is not mapped when this 
 *              method is invoked.
 * @abstract
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type SearchResourceFunctionType<S extends AbstractSearchResult> = 
    (context: IHttpContext, request: SearchRequest, response: SearchResponse<S>) => Promise<void>;

/**
 * @abstract
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ISearchOptions extends IOptions {
    pathName?: string;
    method?:   string;
    requestMethod?: HttpMethodEnum.Get | HttpMethodEnum.Post;
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
        this.total    = total    ?? this._count;
        this.page     = page     ?? 0;
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
export class SearchRequest {
    public readonly page:      number;
    public readonly pageSize:  number;
    public readonly filter:    SearchParams;

    constructor(page: number, pageSize: number, filter: SearchParams) {
        this.page     = page;
        this.pageSize = pageSize;
        this.filter   = filter;
    }

    static create(request: HttpRequest): SearchRequest {
        return new SearchRequest(request.searchParams.getNumber("page", 1)!, 
                                 request.searchParams.getNumber("pageSize", 10)!, 
                                 request.searchParams);
    }
}



export const setSearchMetadata = <T extends Object>(target: T, property: string, options: ISearchOptions = {}) => {
    let _target = getsertObjectMetadata(target, SEARCH_METADATA_KEY, options);
    _target.pathName      = options.pathName ?? DEFAULT_SEARCH_NAME;
    _target.requestMethod = options.requestMethod ?? HttpMethodEnum.Get;
    _target.method        = property;
};


/**
 * @description `@Search` decorator for synchronous functions.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function SearchResource<S extends AbstractSearchResult>(options: ISearchOptions = {}) {
    return function <T extends Object>(target: T, property: string,
                                       descriptor: TypedPropertyDescriptor<SearchResourceFunctionType<S>>) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setSearchMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.