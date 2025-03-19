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

import { HttpMethodEnum } from "../../../http/HTTP";
import { IHttpContext } from "../../../http/IHttpContext";
import { 
    getsertObjectMetadata,
    IOptions
} from "../../../Gestae";
import { AbstractSearchResult } from "./AbstractSearchResult";
import { SearchRequest } from "./SearchRequest";
import { SearchResponse } from "./SearchResponse";

export const SEARCH_METADATA_KEY = "gestaejs:search";
export const DEFAULT_SEARCH_NAME = "search";

/**
 * @description Search Function Type for resources. This function enforces a pagable request/response type for search.
 *              Note: Because no resource is resolved when search is invoked, 'this' keyword is not mapped when this 
 *              method is invoked.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type SearchResourceFunctionType<S extends AbstractSearchResult> = 
    (context: IHttpContext, request: SearchRequest, response: SearchResponse<S>) => Promise<void>;

/**
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
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setSearchMethodMetadata = <T extends Object>(target: T, property: string, options: ISearchOptions = {}) => {
    let _metadata    = getsertObjectMetadata(target, SEARCH_METADATA_KEY, options);
    _metadata.method = property;
    setSearchMetadata(target, _metadata);
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setSearchMetadata = <T extends Object>(target: T, options: ISearchOptions = {}) => {
    const _metadata         = getsertObjectMetadata(target, SEARCH_METADATA_KEY, options);
    _metadata.pathName      = options.pathName ?? DEFAULT_SEARCH_NAME;
    _metadata.requestMethod = options.requestMethod ?? HttpMethodEnum.Get;
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
        setSearchMethodMetadata(target, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function Searchable(options: ISearchOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.dataAsTarget = options.dataAsTarget ?? true;
        setSearchMetadata(target, options);
    };
} // Cant be constant because it is used as a decorator.