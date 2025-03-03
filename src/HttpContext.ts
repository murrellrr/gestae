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

import { IApplicationContext } from "./ApplicationContext";
import { GestaeError } from "./GestaeError";
import { ILogger } from "./Logger";
import { 
    AbstractContext, 
    IContext 
} from "./Context";
import http from 'http';

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export enum HttpMethodEnum {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
    OPTIONS = "options",
    HEAD = "head"
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class URI {
    private readonly _parts: string[];
    private _part: string | null;
    private _index: number = 0;

    constructor(uri: string) {
        // Ensure _parts never contains empty strings
        this._parts = uri.split("/").map(part => part.trim()).filter(part => part.length > 0);
        this._index = 0;
        this._part = this._parts.length > 0 ? this._parts[this._index] : null;
    }

    get part(): string {
        if (this._part === null) throw new GestaeError("No current part available.");
        return this._part;
    }

    next(): string {
        if(!this.hasNext()) throw new GestaeError("End of Path");
        this._part = this._parts[++this._index] ?? null;
        return this._part;
    }

    peek(response: { peek: string }): boolean {
        const _peekIndex = this._index + 1;
        if(_peekIndex < this._parts.length) {
            response.peek = this._parts[_peekIndex];
            return true;
        }
        return false; // No more parts to return
    }

    reset(): void {
        this._index = 0;
        this._part = this._parts.length > 0 ? this._parts[this._index] : null;
    }

    hasNext(): boolean {
        return this._index + 1 < this._parts.length; // Ensure a next element exists
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface Cookie {
    name: string;
    value: string;
    expires?: moment.Moment;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpContext extends IContext{
    get applicationContext(): IApplicationContext;
    get request(): IHttpRequest;
    get response(): IHttpResponse;
    get logger(): ILogger;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
type HeaderValue = string[] | string | undefined;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpRequest {
    get url(): URL;
    get uri(): URI;
    get http(): http.IncomingMessage;
    get query(): Map<string, string>;
    get method(): string;
    getQuery(key: string, defaultValue?:string | undefined): string | undefined;
    hasQueries(): boolean;
    getHeader(key: string, defaultValue?: HeaderValue): HeaderValue;
    isMethod(method: HttpMethodEnum): boolean;
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
    private readonly _request: http.IncomingMessage;
    private readonly _cookies: Record<string, Cookie> = {};
    public readonly url: URL;
    public readonly uri: URI;
    public readonly query: Map<string, string> = new Map();

    constructor(request: http.IncomingMessage) {
        this._request = request;
        
        this.url = new URL(request.url ?? "", `http://${request.headers.host}`);
        this.uri = new URI(this.url.pathname);

        this._parseQueries();
        this._parseCookies();
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

    get method(): string {
        return this._request.method?.toLowerCase() ?? "get";
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

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpResponse {
    set code(code: number);
    get code(): number;
    get http(): http.ServerResponse;
    setHeader(key: string, value: string): void;
    setCookie(key: string, value: Cookie): void;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpResponse implements IHttpResponse {
    private readonly _response: http.ServerResponse

    constructor(response: http.ServerResponse) {
        this._response = response;
    }

    get http(): http.ServerResponse {
        return this._response;
    }

    set code(code: number) {
        this._response.statusCode = code;
    }

    get code(): number {
        return this._response.statusCode;
    }

    setHeader(key: string, value: string): void {
        //
    }

    setCookie(key: string, value: Cookie): void {
        //
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class DefaultHttpContext extends AbstractContext implements IHttpContext {
    private readonly _applicationContext: IApplicationContext;
    private readonly _request: HttpRequest;
    private readonly _response: HttpResponse;

    constructor(applicationContext: IApplicationContext, request: http.IncomingMessage,
                response: http.ServerResponse, private readonly _logger: ILogger) {
        super();
        this._applicationContext = applicationContext;
        this._request = new HttpRequest(request);
        this._response = new HttpResponse(response);
    }

    get applicationContext(): IApplicationContext { // Supports the Interface
        return this._applicationContext;
    }

    get request(): IHttpRequest {
        return this._request as IHttpRequest;
    }

    get response(): IHttpResponse {
        return this._response as IHttpResponse;
    }

    get logger(): ILogger {
        return this._logger;
    }

    static create(options: Record<string, any> = {context: null as unknown as IApplicationContext, 
            request: null as unknown as http.IncomingMessage, 
            response: null as unknown as http.ServerResponse, 
            logger: null as unknown as ILogger}): IHttpContext {
        return new DefaultHttpContext(options.context, options.request, 
        options.response, options.logger);
    }
}