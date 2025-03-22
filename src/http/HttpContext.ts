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

import { IApplicationContext } from "../application/IApplicationContext";
import { ApplicationContext } from "../application/ApplicationContext";
import { ILogger } from "../log/ILogger";
import { AbstractContext } from "../context/AbstractContext";
import { IResourceReader } from "../node/resource/manager/IResourceReader";
import { ResourceManager } from "../node/resource/manager/ResourceManager";
import { IHttpRequest } from "./IHttpRequest";
import { HttpRequest } from "./HttpRequest";
import { 
    HttpResponse, 
    IHttpResponse 
} from "./HttpResponse";
import { INode } from "../node/INode";
import { AbstractNode } from "../node/AbstractNode";
import { GestaeError } from "../error/GestaeError";
import { CancelError } from "../error/CancelError";
import { IHttpContext } from "./IHttpContext";

const SKIP_PATH_PREFIX = `gestaejs:skip:`;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpContext extends AbstractContext implements IHttpContext {
    public readonly context:         ApplicationContext;
    public readonly httpRequest:     HttpRequest;
    public readonly httpResponse:    HttpResponse;
    public readonly log:             ILogger;
    public readonly resourceManager: ResourceManager;
    private         _failed:         boolean = false;
    private         _currentNode:    AbstractNode<any>;
    private         _skip:           boolean = false;

    constructor(context: ApplicationContext, request: HttpRequest, response: HttpResponse,
                currentNode: AbstractNode<any>) {
        super();
        this._currentNode    = currentNode;
        this.context         = context;
        this.httpRequest     = request;
        this.httpResponse    = response;
        this.log = context.log.child({name: `http`, method: this.httpRequest.method,
                                      path: this.httpRequest.url.pathname });
        this.resourceManager = new ResourceManager(this);
    }

    set current(current: AbstractNode<any>) {
        this._skip = false; // Reset skip flag
        this._currentNode = current; // Set the current node
    }

    get resources(): IResourceReader {
        return this.resourceManager;
    }

    get applicationContext(): IApplicationContext { // Supports the Interface
        return this.context;
    }

    get request(): IHttpRequest {
        return this.httpRequest;
    }

    get response(): IHttpResponse {
        return this.httpResponse;
    }

    get currentNode(): INode {
        return this._currentNode;
    }

    cancel(reason?: any): void {
        this.fail(new CancelError(reason ?? "Request canceled."));
    }

    fail(cause?: any): void {
        this._failed = true;
        throw GestaeError.toError(cause);
    }

    get failed(): boolean {
        return this._failed;
    }

    /**
     * @description Instructs the node to leap-from the path and move on to the next child node.
     * @param path 
     */
    set skip(skip: boolean) {
        this._skip = skip;
    }

    get skipped(): boolean {
        return this._skip;
    }

    static create(context: ApplicationContext, request: HttpRequest, response: HttpResponse, 
                  currentNode: AbstractNode<any>): HttpContext {
        return new HttpContext(context, request, 
                               response, currentNode);
    }
}

