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

import { getsertMetadata } from "./Gestae";
import { HttpContext } from "./HttpContext";
import { AbstractSearchResult, SearchRequest } from "./Resource";
import { ITaskOptions } from "./TaskEvent";

export const SEARCH_OPTION_KEY = "gestaejs:search";

export interface ISearchOptions extends ITaskOptions {
    //
};

export const setSearchMetadata = <T extends Object>(target: T, property: string, options: ISearchOptions = {}) => {
    let _target   = getsertMetadata(target, SEARCH_OPTION_KEY);
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