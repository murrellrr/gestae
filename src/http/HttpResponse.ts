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
    ICookie, 
    createCookieString 
} from "./ICookie";
import { UnsupportedMediaTypeError } from "../error/UnsupportedMediaTypeError";
import http from 'http';
import { AbstractHttpResponseBody } from "./AbstractHttpResponseBody";

const SET_COOKIE_HEADER = "Set-Cookie";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpResponse {
    get statusCode(): number;
    get http(): http.ServerResponse;
    get code(): number;
    get body(): object;
    get cookies(): Map<string, ICookie>;
    send(msg: object, code?:number): void;
    setHeader(key: string, value: string): IHttpResponse;
    setCookie(key: string, value: ICookie): IHttpResponse;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpResponse implements IHttpResponse {
    protected readonly content:   AbstractHttpResponseBody<any>;
    protected readonly _cookies:  Map<string, ICookie> = new Map<string, ICookie>();
    public    readonly _response: http.ServerResponse;
    public             body:      any    = undefined;
    public             code:      number = 500;

    constructor(response: http.ServerResponse, responseBody:AbstractHttpResponseBody<any>) {
        this._response = response;
        this.content   = responseBody;
    }

    get http(): http.ServerResponse {
        return this._response;
    }

    get statusCode(): number {
        return this._response.statusCode;
    }

    setHeader(key: string, value: number | string | readonly string[]): IHttpResponse {
        this._response.setHeader(key, value);
        return this;
    }

    setCookie(key: string, value: ICookie): IHttpResponse {
        this._cookies.set(key, value);
        return this;
    }

    get cookies(): Map<string, ICookie> {
        return this._cookies;
    }

    send(body: any, code:number = 200): void {
        if(!body) body = "";
        this.code = code;
        this.body = body;
    }

    get sent(): boolean {
        return this._response.headersSent;
    }

    async write(content?: AbstractHttpResponseBody<any>): Promise<boolean> {
        // convert cookies to headers.
        this.setHeader(SET_COOKIE_HEADER, Array.from(this._cookies.values()).map(
            (cookie: ICookie) => createCookieString(cookie))
        );
        const _content = content ?? this.content;
        if(!_content.supports(this.body)) 
            throw new UnsupportedMediaTypeError(_content.contentType);
        return _content.write(this._response, this.body, this.code);
    }
}