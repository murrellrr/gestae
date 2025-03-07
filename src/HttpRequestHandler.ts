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

import { ApplicationContext } from "./ApplicationContext";
import { HttpMethodEnum } from "./Gestae";
import { 
    GestaeError, 
    MethodNotAllowedError,
    RequestTimeoutError,
} from "./GestaeError";
import { 
    HttpContext,
} from "./HttpContext";
import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";
import { AbstractNode } from "./Node";
import { 
    HttpRequestBody, 
    HttpResponseBody 
} from "./HttpBody";
import { HttpPassThrough } from "./HttpPassThrough";
import http from "http";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractHttpRequestHandler {
    protected readonly size:         number;
    protected readonly timeout:      number;
    protected readonly context:      ApplicationContext;
    protected readonly root:         AbstractNode<any>;
    protected readonly requestBody:  HttpRequestBody<any>;
    protected readonly responseBody: HttpResponseBody<any>;

    constructor(context: ApplicationContext, root: AbstractNode<any>, 
                requestBody: HttpRequestBody<any>, responseBody: HttpResponseBody<any>, 
                sizeMB: number, timeoutMS: number) {
        this.context      = context;
        this.root         = root;
        this.requestBody  = requestBody;
        this.responseBody = responseBody;
        this.size         = sizeMB;
        this.size         = this.size * 1024 * 1024;
        this.timeout      = timeoutMS;
    }

    protected abstract createHttpContext(req: HttpRequest, res: HttpResponse): HttpContext;

    protected abstract handleError(httpc: HttpContext, error?: any): Promise<void>;

    protected abstract processRequest(httpc: HttpContext): Promise<void>;

    async handleRequest(req: http.IncomingMessage, 
                        res: http.ServerResponse): Promise<void> {
        const _this = this;
        // Set up the request size limitter.
        const _limitter = new HttpPassThrough();
        _limitter.addSizeLimitter(this.size);

        // Setting up the timout action
        req.setTimeout(this.timeout, () => {
            req.destroy(new RequestTimeoutError(_this.timeout));
        });

        // handle the incomming request like a champ!
        const _req   = new HttpRequest(req, _limitter, this.requestBody, 
                                       this.context.log.child({name: HttpRequest.name}));
        const _res   = new HttpResponse(res, this.responseBody);
        const _httpc = this.createHttpContext(_req, _res);

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
            httpc.log.info(`Request processed with response code ${httpc.response.code} and pending write to client.`);
            if(this.context.log.level === "debug")
                httpc.log.debug(`Response: \r\n${JSON.stringify(httpc.response.body, null, 2)}`);
        }
    }

    static create(context: ApplicationContext, root: AbstractNode<any>, 
                  requestBody: HttpRequestBody<any>, responseBody: HttpResponseBody<any>,
                  sizeMB: number, timeoutMS: number): AbstractHttpRequestHandler {
        return new HttpRequestHandler(context, root, requestBody, responseBody, 
                                      sizeMB, timeoutMS);
    }
}