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

import { GestaeError } from "../error/GestaeError";
import { UnsupportedMediaTypeError } from "../error/UnsupportedMediaTypeError";
import { AbstractHttpRequestBody } from "./AbstractHttpRequestBody";
import { HttpPassThrough } from "./HttpPassThrough";
import http from "node:http";

const CONTENT_TYPE_REQUEST_HEADER = "content-type";
const CONTENT_LEN_REQUEST_HEADER  = "content-length";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class JSONRequestBody extends AbstractHttpRequestBody<object> {
    /**
     * @description
     * @param request 
     * @param passThrough 
     * @returns 
     */
    async getBody(request: http.IncomingMessage, passThrough: HttpPassThrough): Promise<Object> {
        const _contentType   = request.headers[CONTENT_TYPE_REQUEST_HEADER] ?? "";
        const _contentLength = request.headers[CONTENT_LEN_REQUEST_HEADER] ?? "0";

        // Going to check for type &&|| length and just return an empty body if need be.
        if(_contentLength === "0" || _contentType.trim() === "")
            return {};

        if(!(/^application\/.*json$/.test(_contentType)))
            throw new UnsupportedMediaTypeError(_contentType);

        let _body = "";
        return new Promise<Object>((resolve, reject) => {
            passThrough.pipe.on("data", (chunk: Buffer | string) => {
                _body += typeof chunk === "string" ? chunk : chunk.toString("utf8");
            });

            passThrough.pipe.on("end", () => {
                let _requestBody = {};
                try {
                    if(_body.trim().length > 0) _requestBody = JSON.parse(_body);
                    resolve(_requestBody);
                }
                catch(error) {
                    reject(GestaeError.toError(error)); // we just set it above.
                }
            });
      
            passThrough.pipe.on("error", (error) => {
                reject(GestaeError.toError(error)); // we just set it above.
            });
        });
    }

    async read(request: http.IncomingMessage, passThrough: HttpPassThrough): Promise<Object> {
        try {
            let _body = await this.getBody(request, passThrough);
            return _body;
        }
        catch(error) {
            // handle any rejections not handled by the passThrough.
            throw GestaeError.toError(error);
        }
    }
}