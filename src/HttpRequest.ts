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
    Cookie, 
    HeaderValue,
    HttpMethodEnum 
} from "./Gestae";
import { SearchParams } from "./SearchParams";
import { 
    HttpRequestBody, 
    JSONRequestBody 
} from "./HttpBody";
import _ from "lodash";
import http from "node:http";
import { PassThrough } from "node:stream";

const DEFAULT_CONTENT_TYPE_HEADER = "content-type";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class URITree {
    private readonly _nodes: string[];
    private _node: string | undefined;
    private _index: number = 0;

    constructor(uri: string) {
        // Ensure _nodes never contains empty strings
        this._nodes = uri.split("/").map(node => node.trim()).filter(node => node.length > 0);
        this._index = 0;
        this._node  = this._nodes.length > 0 ? this._nodes[this._index] : undefined;
    }

    /**
     * @description Gets the current node in the tree.
     * @returns The current node in the tree or undefined if no more nodes exist.
     */
    get node(): string | undefined {
        if(!this._node) return undefined;
        return this._node;
    }

    /**
     * @description Advanced the inde on the tree and returns the next node.
     * @returns The next node in the tree or undefined if no more nodes exist.
     */
    get next(): string | undefined {
        if(!this.hasNext) return undefined;
        this._node = this._nodes[++this._index] ?? undefined;
        return this._node;
    }

    /**
     * @description Looks at the next path node in the tree without advancing the index.
     * @returns The next path node in the tree or undefined if no more nodes exist.
     */
    get peek(): string | undefined {
        const _peekIndex = this._index + 1;
        if(_peekIndex < this._nodes.length)
            return this._nodes[_peekIndex];
        return undefined; // No more nodes to return
    }

    /**
     * @description Determines if the current node is the target node in question be determining
     *              if there are any remaining nodes on the tree.
     * @returns True if the current node is the target node, false otherwise.
     * @see URITree#hasNext
     */
    get target(): boolean {
        return !this.hasNext;
    }

    /**
     * @description Resets the index of the tree to the root node.
     */
    reset(): void {
        this._index = 0;
        this._node = this._nodes.length > 0 ? this._nodes[this._index] : undefined;
    }

    get hasNext(): boolean {
        return this._index + 1 < this._nodes.length; // Ensure a next element exists
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpRequest {
    get url(): URL;
    get uri(): URITree;
    get http(): http.IncomingMessage;
    get method(): HttpMethodEnum;
    get searchParams(): SearchParams;
    getContentType(): string;
    getHeader(key: string, defaultValue?: HeaderValue): HeaderValue;
    isMethod(method: HttpMethodEnum): boolean;
    getBody<T extends Object>(): T;
    mergeBody<T>(body: T): Promise<T>;
    get isCreate(): boolean;
    get isRead(): boolean;  
    get isUpdate(): boolean;  
    get isDelete(): boolean;
    get isFind(): boolean;
    get isPatch(): boolean;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpRequest implements IHttpRequest{
    private            body:         Object = {}
    protected content:               HttpRequestBody<any>;
    public    readonly _request:     http.IncomingMessage;
    public    readonly _cookies:     Record<string, Cookie> = {};
    public             _method:      HttpMethodEnum = HttpMethodEnum.Unsupported;
    public    readonly searchParams: SearchParams;
    public    readonly url:          URL;
    public    readonly uri:          URITree;

    constructor(request: http.IncomingMessage, pipe: PassThrough) {
        this._request     = request;
        this.url          = new URL(request.url ?? "", `http://${request.headers.host}`);
        this.uri          = new URITree(this.url.pathname);
        this.searchParams = new SearchParams(this.url);
        this.content      = new JSONRequestBody(pipe);
        this._parseCookies();
        this._parseMethod();
    }

    private _parseMethod() {
        if(!this._request.method) return;
        const method = this._request.method.toLowerCase();
        switch(method) {
            case "get": 
                this._method = HttpMethodEnum.Get; 
                break;
            case "post":
                this._method = HttpMethodEnum.Post; 
                break;
            case "put":
                this._method = HttpMethodEnum.Put; 
                break;
            case "delete":
                this._method = HttpMethodEnum.Delete;
                break;
            case "patch":
                this._method = HttpMethodEnum.Patch;
                break;
            case "options":
                this._method = HttpMethodEnum.Options;
                break;
            case "head":
                this._method = HttpMethodEnum.Head;
                break;
            default: this._method = HttpMethodEnum.Unsupported;
        }
    }

    private _parseCookies() {
        // parse the cookies
        const _cookieHeader = this._request.headers.cookie;
        if(_cookieHeader) {
            const _cookkieValues = _cookieHeader.split(";").map(cookie => cookie.trim());
            for(const cookieStr of _cookkieValues) {
                const _index = cookieStr.indexOf("=");
                if(_index === -1) continue; // Invalid cookie segment.
                const _cookieName = cookieStr.substring(0, _index).trim();
                const _cookieValue = cookieStr.substring(_index + 1).trim();
                this._cookies[_cookieName] = {
                    name: _cookieName,
                    value: _cookieValue
                };
            }
        }
    }

    public async prepare(): Promise<void> {
        return this.content.read(this._request);
    }

    get http(): http.IncomingMessage {
        return this._request;
    }

    getBody<T extends Object>(): T {
        return this.body as T;
    }

    async mergeBody<T>(body: T): Promise<T> {
        return _.merge(body, this.getBody());
    }

    get method(): HttpMethodEnum {
        return this._method;
    }

    isMethod(method: HttpMethodEnum): boolean {
        return this.method === method;
    }

    get isCreate(): boolean {
        return this.isMethod(HttpMethodEnum.Post);
    }

    get isRead(): boolean {
        return this.isMethod(HttpMethodEnum.Get) && !this.searchParams.hasParams;
    }   

    get isUpdate(): boolean {
        return this.isMethod(HttpMethodEnum.Put);
    }   

    get isDelete(): boolean {
        return this.isMethod(HttpMethodEnum.Delete);
    }

    get isFind(): boolean {
        return this.isMethod(HttpMethodEnum.Get) && this.searchParams.hasParams;
    }

    get isPatch(): boolean {
        return this.isMethod(HttpMethodEnum.Patch);
    }

    getContentType(): string {
        return this.getHeader(DEFAULT_CONTENT_TYPE_HEADER) as string;
    }

    getHeader(key: string, defaultValue?: HeaderValue): HeaderValue {
        return this._request.headers[key.toLowerCase()] ?? defaultValue;
    }

    getCookie(key: string, defaultValue?: Cookie | undefined): Cookie | undefined {
        return undefined; // TODO: Implement cookie retrieval.
    }
}