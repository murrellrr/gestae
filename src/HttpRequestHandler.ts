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

import { PassThrough } from "node:stream";
import { ApplicationContext } from "./ApplicationContext";
import { HttpMethodEnum } from "./Gestae";
import { 
    CancelError,
    GestaeError, 
    MethodNotAllowedError, 
    RequestEntityTooLargeError
} from "./GestaeError";
import { 
    HttpContext,
} from "./HttpContext";
import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";
import { AbstractNode } from "./Node";
import http from "node:http";

const DEFAULT_MAX_REQUEST_SIZE_MB = 5;

/**
 * 
 * @param maxSize 
 */
const createSizeLimitPassthroug = (maxSize: number, onOversizedLoad: (total: number) => boolean): PassThrough => {
    // Add listener to enfource max request size.
    let   _totalLength = 0;
    const _pass        = new PassThrough();

    // Monitor the incomming request to ensure it doesnt exceed the max size.
    _pass.on("data", (chunk: Buffer | string) => {
        // Determine the byte length of the chunk
        const chunkSize = typeof chunk === "string" ? Buffer.byteLength(chunk, "utf8") : chunk.length;
        _totalLength += chunkSize;
        if(_totalLength > maxSize) {
            if(onOversizedLoad(_totalLength))
                throw new RequestEntityTooLargeError("Request body exceeds maximum allowed size");
        }
    });

    return _pass;
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractHttpRequestHandler {
    protected maxSize: number;
    constructor(
        public readonly context: ApplicationContext,
        public readonly root:    AbstractNode<any>,
        maxSizeMB?: number
    ) {
        // this.maxSize = maxSizeMB ? maxSizeMB * 1024 * 1024 : 
        //                            DEFAULT_MAX_REQUEST_SIZE_MB * 1024 * 1024;
        this.maxSize = 1;
    }

    protected abstract createHttpContext(req: HttpRequest, res: HttpResponse): HttpContext;

    protected abstract handleError(httpc: HttpContext, error?: any): Promise<void>;

    protected abstract processRequest(httpc: HttpContext): Promise<void>;

    async handleRequest(req: http.IncomingMessage, 
                        res: http.ServerResponse): Promise<void> {
        let _limitPipe = createSizeLimitPassthroug(this.maxSize, (total: number) => {
            // Exceeded maximum size: send error response and pause the request stream.
            req.pause();
            return true;
        });

        // handle the incomming request like a champ!
        const _req   = new HttpRequest(req, _limitPipe);
        const _res   = new HttpResponse(res);
        const _httpc = this.createHttpContext(_req, _res);

        // Prepare the request to read data and such.
        let _loader = _req.prepare();
        // Set-up the passthrough
        req.pipe(_limitPipe);
        await _loader;

        try {
            await this.processRequest(_httpc);
        }
        catch(error) {
            await this.handleError(_httpc, error);
        }
        finally {
            if(await _res.write()) 
                _httpc.log.debug("Response written to client.");
            else 
                _httpc.log.warn("Failed to write response to client.");
        }
    }
}

export class HttpRequestHandler extends AbstractHttpRequestHandler {
    createHttpContext(req: HttpRequest, res: HttpResponse): HttpContext {
        return HttpContext.create(this.context, req, res);
    }

    protected async handleError(httpc: HttpContext, error?: any): Promise<void> {
        const _error = GestaeError.toError(error);
        httpc.log.error(`Error processing ${httpc.request.method} request ${httpc.request.url}:\r\n${JSON.stringify(error, null, 2)}\r\n${_error.stack}`);
        httpc.response.error(_error);
    }

    protected async processRequest(httpc: HttpContext): Promise<void> {
        if(httpc.request.method === HttpMethodEnum.Unsupported)
            throw new MethodNotAllowedError(httpc.request.method);
        else {
            await this.root.doRequest(httpc);
            if(httpc.canceled) 
                throw new CancelError(httpc.reason);
            else {
                httpc.log.info(`Request processed with response code ${httpc.response.code} and pending write to client.`);
                if(this.context.log.level === "debug")
                    httpc.log.debug(`Response: \r\n${JSON.stringify(httpc.response.body, null, 2)}`);
            }
        }
    }

    static create(context: ApplicationContext, root: AbstractNode<any>, 
                  maxSizeMB: number = DEFAULT_MAX_REQUEST_SIZE_MB): AbstractHttpRequestHandler {
        return new HttpRequestHandler(context, root, maxSizeMB);
    }
}