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

import { IOptions, setMetadata } from "./Gestae";
import { IHttpRequest } from "./HttpRequest";

export const RESOURCE_OPTION_KEY = "gestaejs:resource";

/**
 * @description Action types for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export enum ResourceActionEnum {
    Create      = "create",
    Read        = "read",
    Update      = "update",
    Delete      = "delete",
    MediaSearch = "mediaSearch",
    Search      = "search", // TODO: On search response, loop through and update paths not specified relative to resource.
}

/**
 * @description Options for a resource.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceOptions extends IOptions {
    name?: string;
    idProperty?: string;
    resourceId?:string;
    lazyLoad?: boolean;
    supportedActions?: ResourceActionEnum[];
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
        public readonly id: string,
        public readonly path: string
    ) {}
}

/**
 * @description Resource search request.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchRequest {
    constructor(
        public readonly page: number,
        public readonly pageSize: number,
        public readonly filter: Map<string, string>
    ) {}

    static create(request: IHttpRequest): SearchRequest {
        return new SearchRequest(1, 10, new Map());
    }
}

/**
 * @description Resource search response.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchResponse<R extends AbstractSearchResult> {
    constructor(
        public readonly data:     R[],
        public readonly total:    number,
        public readonly page:     number,
        public readonly pageSize: number
    ) {}

    *[Symbol.iterator](): Iterator<R> {
        for (const item of this.data) {
            yield item;
        }
    }
} // Cant be constant because it is used as a decorator.

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function Resource(options: IResourceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name;
        setMetadata(target, RESOURCE_OPTION_KEY, options);
    };
} // Cant be constant because it is used as a decorator.