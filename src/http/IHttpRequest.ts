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

import { URITree } from "./URITree";
import { SearchParams } from "./SearchParams";
import { HttpMethodEnum, GestaeHeaderValue } from "./HTTP";
import { ICookie } from "./ICookie";
import http from "node:http";
import { AbstractHttpRequestBody } from "./AbstractHttpRequestBody";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpRequest {
    get url(): URL;
    get uriTree(): URITree;
    get http(): http.IncomingMessage;
    get method(): HttpMethodEnum;
    get searchParams(): SearchParams;
    getContentType(): string;
    getHeader(key: string, defaultValue?: GestaeHeaderValue): GestaeHeaderValue;
    getCookie(key: string, defaultValue?: ICookie | undefined): ICookie | undefined;
    isMethod(method: HttpMethodEnum): boolean;

    /**
     * @description Gets the body of the request using the request handler provided.
     * @param content The request handler to use to read the body, overrides the 
     *                default request handler. This only applies to invocations 
     *                when the body is actually loaded.
     * @returns The body of the request.
     */
    getBody<T>(content?: AbstractHttpRequestBody<T>): Promise<T>;

    /**
     * @description Merges the request body with the provided object.
     * @param body The object to merge the request body with.
     */
    mergeBody<T>(body: T): Promise<T>;

    get isCreate(): boolean;
    get isRead(): boolean;  
    get isUpdate(): boolean;  
    get isDelete(): boolean;
    get isFind(): boolean;
    get isPatch(): boolean;
}