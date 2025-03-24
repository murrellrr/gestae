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

import { ApplicationContext } from "../application/ApplicationContext";
import { HttpMethodEnum } from "./HTTP";
import { GestaeError } from "../error/GestaeError";
import { MethodNotAllowedError } from "../error/MethodNotAllowedError";
import { RequestTimeoutError } from "../error/RequestTimeoutError";
import { HttpContext } from "./HttpContext";
import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";
import { AbstractNode } from "../node/AbstractNode"
import { AbstractHttpRequestBody } from "./AbstractHttpRequestBody";
import { AbstractHttpResponseBody } from "./AbstractHttpResponseBody";
import { HttpPassThrough } from "./HttpPassThrough";
import { HttpEvent, HttpEvents } from "./HttpEvent";
import { createApplicationEventPath, createHttpEventPath } from "../events/GestaeEvent";
import { IHttpData } from "./IHttpData";
import { ApplicationEvent, ApplicationEvents } from "../application/ApplicationEvent";
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
    protected readonly requestBody:  AbstractHttpRequestBody<any>;
    protected readonly responseBody: AbstractHttpResponseBody<any>;

    constructor(context: ApplicationContext, root: AbstractNode<any>, 
                requestBody: AbstractHttpRequestBody<any>, responseBody: AbstractHttpResponseBody<any>, 
                sizeMB: number, timeoutMS: number) {
        this.context      = context;
        this.root         = root;
        this.requestBody  = requestBody;
        this.responseBody = responseBody;
        this.size         = sizeMB * 1024 * 1024;
        this.timeout      = timeoutMS;
    }

    protected abstract createHttpContext(req: HttpRequest, res: HttpResponse, 
                                        root: AbstractNode<any>): HttpContext;

    protected abstract handleError(httpc: HttpContext, error?: any): Promise<void>;

    protected abstract processRequest(httpc: HttpContext): Promise<void>;

    protected async _emitHttpBefore(httpc: HttpContext): Promise<void> {
        this.context.eventEmitter.emit(
            new HttpEvent<IHttpData>(httpc, {requestBody: this.requestBody, responseBody: this.responseBody},
                createHttpEventPath(HttpEvents.Http.OnBefore)));
    }

    protected async _emitHttpAfter(httpc: HttpContext): Promise<void> {
        this.context.eventEmitter.emit(
            new HttpEvent<IHttpData>(httpc, {requestBody: this.requestBody, responseBody: this.responseBody},
                createHttpEventPath(HttpEvents.Http.OnAfter)));
    }

    protected async _emitBeforeError(httpc: HttpContext): Promise<void> {
        try {
            this.context.eventEmitter.emit(
                new ApplicationEvent<IHttpData>(this.context, {requestBody: this.requestBody, responseBody: this.responseBody},
                    createApplicationEventPath(ApplicationEvents.Error.OnBefore)));
        }
        catch(error) {
            this.context.log.error(`AbstractHttpRequestHandler._emitBeforeError(): Error raised in error event: ${error}`);
        }
    }

    protected async _emitAfterError(httpc: HttpContext): Promise<void> {
        try {
            this.context.eventEmitter.emit(
                new ApplicationEvent<IHttpData>(this.context, {requestBody: this.requestBody, responseBody: this.responseBody},
                    createApplicationEventPath(ApplicationEvents.Error.OnAfter)));
        }
        catch(error) {
            this.context.log.error(`AbstractHttpRequestHandler._emitAfterError(): Error raised in error event: ${error}`);
        }
    }

    protected async _emitHttpMethodBefore(httpc: HttpContext): Promise<void> {
        this.context.eventEmitter.emit(
            new HttpEvent<IHttpData>(httpc, {requestBody: this.requestBody, responseBody: this.responseBody},
                createHttpEventPath({
                    operation: HttpEvents.Http.OnBefore.operation,
                    action:    HttpEvents.Http.OnBefore.action,
                    topic:     httpc.request.method
                })));
    }

    protected async _emitHttpMethodAfter(httpc: HttpContext): Promise<void> {
        this.context.eventEmitter.emit(
            new HttpEvent<IHttpData>(httpc, {requestBody: this.requestBody, responseBody: this.responseBody},
                createHttpEventPath({
                    operation: HttpEvents.Http.OnAfter.operation,
                    action:    HttpEvents.Http.OnAfter.action,
                    topic:     httpc.request.method
                })));
    }

    async handleRequest(req: http.IncomingMessage, 
                        res: http.ServerResponse,
                        root: AbstractNode<any>): Promise<void> {
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
        const _httpc = this.createHttpContext(_req, _res, root);

        try {
            await this._emitHttpBefore(_httpc);
            await this._emitHttpMethodBefore(_httpc);
            await this.processRequest(_httpc);
        }
        catch(error) {
            this.context.log.error(`AbstractHttpRequestHandler.handleRequest(): Error processing request: ${error}\r\n${(error as any).stack}`);
            await this._emitBeforeError(_httpc);
            await this.handleError(_httpc, error);
            await this._emitAfterError(_httpc);
        }
        finally {
            try {
                if(await _res.write())
                    _httpc.log.debug("AbstractHttpRequestHandler.handleRequest(): Response written to client.");
                else 
                    _httpc.log.warn("AbstractHttpRequestHandler.handleRequest(): Failed to write response to client.");
            }
            catch(error) {
                this.context.log.error(`AbstractHttpRequestHandler.handleRequest(): Error writing response: ${error}\r\n${(error as any).stack}`);
            }
            await this._emitHttpMethodAfter(_httpc);
            await this._emitHttpAfter(_httpc);
        }
    }
}

export class HttpRequestHandler extends AbstractHttpRequestHandler {
    createHttpContext(req: HttpRequest, res: HttpResponse, root: AbstractNode<any>): HttpContext {
        return HttpContext.create(this.context, req, res, root);
    }

    protected async handleError(httpc: HttpContext, error?: any): Promise<void> {
        const _error = GestaeError.toError(error);
        httpc.log.error(`Error processing ${httpc.request.method} request ${httpc.request.url}:\r\n\r\n${JSON.stringify(error, null, 2)}\r\n\r\n${_error.stack}\r\n\r\n`);
        httpc.response.send(_error.safe);
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
                  requestBody: AbstractHttpRequestBody<any>, responseBody: AbstractHttpResponseBody<any>,
                  sizeMB: number, timeoutMS: number): AbstractHttpRequestHandler {
        return new HttpRequestHandler(context, root, requestBody, responseBody, 
                                      sizeMB, timeoutMS);
    }
}