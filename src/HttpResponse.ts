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

import { GestaeError } from "./GestaeError";
import { Cookie } from "./Gestae";
import http from 'http';

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
    get failed(): boolean;
    send(msg: object, code?:number): void;
    error(error: GestaeError): void;
    setHeader(key: string, value: string): void;
    setCookie(key: string, value: Cookie): void;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpResponse implements IHttpResponse {
    private         _failed: boolean = false;
    public readonly _response: http.ServerResponse;
    public          body: object = {};
    public          code: number = 200;

    constructor(response: http.ServerResponse) {
        this._response = response;
    }

    get http(): http.ServerResponse {
        return this._response;
    }

    get statusCode(): number {
        return this._response.statusCode;
    }

    get failed(): boolean {
        return this._failed;
    }

    setHeader(key: string, value: number | string | readonly string[]): void {
        this._response.setHeader(key, value);
    }

    setCookie(key: string, value: Cookie): void {
        //
    }

    send(body: object, code:number = 200): void {
        if(!this._failed) {
            this.code = code;
            this.body = body;
        }
    }

    error(error: GestaeError) {
        this._failed = true;
        this.code = error.code;
        this.body = error.safe();
    }

    write() {
        this._response.statusCode = this.code;
        this._response.setHeader("Content-Type", "application/json");
        this._response.write(JSON.stringify(this.body, null, 2));
        this._response.end();
    }
}