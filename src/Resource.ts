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
    IOptions, 
    setMetadata 
} from "./Gestae";

export const RESOURCE_METADATA_KEY = "gestaejs:resource";

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
    Search      = "search"
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
        setMetadata(target, RESOURCE_METADATA_KEY, options);
    };
} // Cant be constant because it is used as a decorator.

