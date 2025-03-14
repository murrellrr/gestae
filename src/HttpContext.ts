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
    ApplicationContext, 
    IApplicationContext 
} from "./ApplicationContext";
import { ILogger } from "./Logger";
import { 
    AbstractContext, 
    IContext 
} from "./Context";
import {
    IResourceReader, 
    ResourceManager 
} from "./ResourceManager";
import { 
    HttpRequest, 
    IHttpRequest 
} from "./HttpRequest";
import { 
    HttpResponse, 
    IHttpResponse 
} from "./HttpResponse";
import { 
    AbstractNode, 
    INode 
} from "./Node";
import { CancelError, GestaeError } from "./GestaeError";

const LEAP_PATH_PREFIX = `gestaejs:leap:`;

/**
 * @description Interface used externally to Gestae to expose safely HttpContext.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpContext extends IContext {
    get applicationContext(): IApplicationContext;
    get resources():          IResourceReader;
    get request():            IHttpRequest;
    get response():           IHttpResponse;
    get log():                ILogger;
    get currentNode():        INode;
    cancel(reason?: any):     void;
    fail(cause?: any):        void;
    get failed():             boolean;
}

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
    public          _currentNode:    AbstractNode<any>;
    public          _failed:         boolean = false;

    constructor(context: ApplicationContext, request: HttpRequest, response: HttpResponse,
                currentNode: AbstractNode<any>) {
        super();
        this._currentNode    = currentNode;
        this.resourceManager = new ResourceManager();
        this.context         = context;
        this.httpRequest     = request;
        this.httpResponse    = response;
        this.log = context.log.child({name: `http`, method: this.httpRequest.method,
                                      path: this.httpRequest.url.pathname });
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
    leap(path: string): void {
        this.setValue(`${LEAP_PATH_PREFIX}${path}`, true);
    }

    leapt(path: string): boolean {
        return this.getValue(`${LEAP_PATH_PREFIX}${path}`);
    }

    static create(context: ApplicationContext, request: HttpRequest, response: HttpResponse, 
                  currentNode: AbstractNode<any>): HttpContext {
        return new HttpContext(context, request, 
                               response, currentNode);
    }
}

