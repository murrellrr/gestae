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
import http from "node:http";

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

    get node(): string | undefined {
        if(!this._node) return undefined;
        return this._node;
    }

    get next(): string | undefined {
        if(!this.hasNext) return undefined;
        this._node = this._nodes[++this._index] ?? null;
        return this._node;
    }

    get peek(): string | undefined {
        const _peekIndex = this._index + 1;
        if(_peekIndex < this._nodes.length)
            return this._nodes[_peekIndex];
        return undefined; // No more nodes to return
    }

    get target(): boolean {
        return !this.hasNext;
    }

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
    get query(): Map<string, string>;
    get method(): HttpMethodEnum;
    get canceled(): boolean;
    get cause(): any;
    getQuery(key: string, defaultValue?:string | undefined): string | undefined;
    hasQueries(): boolean;
    getHeader(key: string, defaultValue?: HeaderValue): HeaderValue;
    isMethod(method: HttpMethodEnum): boolean;
    cancel(cause?: any): void;
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
    private readonly _request:  http.IncomingMessage;
    private readonly _cookies:  Record<string, Cookie> = {};
    private          _canceled: boolean = false;
    private          _cause:    any;
    private          _method:   HttpMethodEnum = HttpMethodEnum.UNSUPPORTED;
    public  readonly url:       URL;
    public  readonly uri:       URITree;
    public  readonly query:     Map<string, string> = new Map();

    constructor(request: http.IncomingMessage) {
        this._request = request;
        
        this.url = new URL(request.url ?? "", `http://${request.headers.host}`);
        this.uri = new URITree(this.url.pathname);

        this._parseQueries();
        this._parseCookies();
        this._parseMethod();
    }

    cancel(cause?: any): void {
        if(!this._canceled) {
            this._canceled = true;
            this._cause = cause;
        }
    }

    get canceled(): boolean {
        return this._canceled;
    }

    get cause(): any {
        return this._cause;
    }

    private _parseMethod() {
        if(!this._request.method) return;
        const method = this._request.method.toLowerCase();
        switch(method) {
            case "get": 
                this._method = HttpMethodEnum.GET; 
                break;
            case "post":
                this._method = HttpMethodEnum.POST; 
                break;
            case "put":
                this._method = HttpMethodEnum.PUT; 
                break;
            case "delete":
                this._method = HttpMethodEnum.DELETE;
                break;
            case "patch":
                this._method = HttpMethodEnum.PATCH;
                break;
            case "options":
                this._method = HttpMethodEnum.OPTIONS;
                break;
            case "head":
                this._method = HttpMethodEnum.HEAD;
                break;
            default: this._method = HttpMethodEnum.UNSUPPORTED;
        }
    }

    private _parseQueries() {
        // set the query params
        this.url.searchParams.forEach((value, key) => {
            this.query.set(key, value);
        });
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

    get http(): http.IncomingMessage {
        return this._request;
    }

    get method(): HttpMethodEnum {
        return this._method;
    }

    isMethod(method: HttpMethodEnum): boolean {
        return this.method === method;
    }

    get isCreate(): boolean {
        return this.isMethod(HttpMethodEnum.POST);
    }

    get isRead(): boolean {
        return this.isMethod(HttpMethodEnum.GET) && !this.hasQueries();
    }   

    get isUpdate(): boolean {
        return this.isMethod(HttpMethodEnum.PUT);
    }   

    get isDelete(): boolean {
        return this.isMethod(HttpMethodEnum.DELETE);
    }

    get isFind(): boolean {
        return this.isMethod(HttpMethodEnum.GET) && this.hasQueries();
    }

    get isPatch(): boolean {
        return this.isMethod(HttpMethodEnum.PATCH);
    }

    hasQueries(): boolean {
        return this.query.size > 0;
    }

    getQuery(key: string, defaultValue?:string | undefined): string | undefined {
        return this.query.get(key) ?? defaultValue;
    }

    getHeader(key: string, defaultValue?: HeaderValue): HeaderValue {
        return this._request.headers[key.toLowerCase()] ?? defaultValue;
    }

    getCookie(key: string, defaultValue?: Cookie | undefined): Cookie | undefined {
        return undefined
    }
}