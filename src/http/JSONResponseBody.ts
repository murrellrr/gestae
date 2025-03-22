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

import http from "node:http";
import { AbstractHttpResponseBody } from "./AbstractHttpResponseBody";

const CONTENT_TYPE_RESPONSE_HEADER = "Content-Type";
const DEFAULT_JSON_CONTENT_TYPE    = "application/json";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class JSONResponseBody extends AbstractHttpResponseBody<object | string> {
    supports(body: any): boolean {
        return typeof body === "object" || typeof body === "string";
    }

    get contentType(): string {
        return DEFAULT_JSON_CONTENT_TYPE;
    }

    async write(response: http.ServerResponse, body: object | string = {}, code: number = 200, contentType?:string): Promise<boolean> {
        if(!response.writable || response.headersSent) return false;

        // 204 when body is an empty object or empty string
        if((typeof body === "string" && !body.trim()) ||
                (typeof body === "object" && !Object.keys(body).length)) {
            response.writeHead(204);
            response.end();
            return true;
        }

        const payload = typeof body === "string" ? JSON.parse(body) : body;
        response.setHeader(
            CONTENT_TYPE_RESPONSE_HEADER,
            contentType ?? payload.$contentType ?? DEFAULT_JSON_CONTENT_TYPE
        );
        response.writeHead(code);
        response.end(JSON.stringify(payload));
        
        return true;
    }
}