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
import { GestaeError, RequestEntityTooLargeError, UnsupportedMediaTypeError } from './GestaeError';

const CONTENT_TYPE_REQUEST_HEADER  = "content-type";
const CONTENT_TYPE_RESPONSE_HEADER = "Content-Type";
const DEFAULT_JSON_CONTENT_TYPE    = "application/json";
const DEFAULT_MAX_REQUEST_SIZE_MB  = 4;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class HttpRequestBody<T> {
    abstract read(request: http.IncomingMessage): Promise<T>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class HttpResponseBody<T> {
    abstract write(response: http.ServerResponse, body: object, code: number, contentType?:string): Promise<boolean>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class JSONRequestBody extends HttpRequestBody<object> {
    private readonly maxSizeB: number;

    constructor(maxMB: number = DEFAULT_MAX_REQUEST_SIZE_MB) {
        super();
        this.maxSizeB = maxMB * 1024 * 1024;
    }

    async read(request: http.IncomingMessage): Promise<object> {
        const _contentType = request.headers[CONTENT_TYPE_REQUEST_HEADER] ?? "";
        if(!(/^application\/.*json$/.test(_contentType)))
            throw new UnsupportedMediaTypeError(_contentType);

        return new Promise<object>((resolve, reject) => {
            let _body: string = "";
            let totalLength = 0;
      
            request.on("data", (chunk: Buffer | string) => {
                const _chunkStr = typeof chunk === "string" ? chunk : chunk.toString("utf8");
                totalLength += Buffer.byteLength(_chunkStr, "utf8");
                if (totalLength > this.maxSizeB) {
                    // Exceeded maximum size: reject and destroy the stream
                    reject(new RequestEntityTooLargeError(`Request body exceeds maximum allowed size of ${this.maxSizeB} Bytes.`));
                    request.pause();
                    return;
                }
                _body += _chunkStr;
            });
      
            request.on("end", () => {
                try {
                    resolve(JSON.parse(_body));
                }
                catch(error) {
                    reject(new GestaeError("Failed to parse JSON body", 500, error));
                }
            });
      
            request.on("error", (err) => {
                reject(new GestaeError("Error reading request", 500, err));
            });
        });
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class JSONResponseBody extends HttpResponseBody<object> {
    async write(response: http.ServerResponse, body: object, code: number, contentType?:string): Promise<boolean> {
        if(response.writable && !response.headersSent){
            response.setHeader(CONTENT_TYPE_RESPONSE_HEADER, 
                            contentType ?? (body as any).$contentType ?? DEFAULT_JSON_CONTENT_TYPE);
            response.writeHead(code);
            response.end(JSON.stringify(body));
            return true;
        }
        else return false;
    }
}