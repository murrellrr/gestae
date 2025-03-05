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

import { IApplicationContext } from "./ApplicationContext";
import { ILogger } from "./Logger";
import { 
    AbstractContext, 
    IContext 
} from "./Context";
import { 
    IResourceManager, 
    ResourceManager 
} from "./ResourceManager";
import { IHttpRequest } from "./HttpRequest";
import { IHttpResponse } from "./HttpResponse";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IHttpContext extends IContext {
    get applicationContext(): IApplicationContext;
    get resources():          IResourceManager;
    get request():            IHttpRequest;
    get response():           IHttpResponse;
    get log():                ILogger;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class DefaultHttpContext extends AbstractContext implements IHttpContext {
    private readonly _applicationContext: IApplicationContext;
    public  readonly request:             IHttpRequest;
    public  readonly response:            IHttpResponse;
    public  readonly log:                 ILogger;
    public  readonly _resources:          ResourceManager;

    constructor(applicationContext: IApplicationContext, request: IHttpRequest, response: IHttpResponse) {
        super();
        this._resources = new ResourceManager();
        this._applicationContext = applicationContext;
        this.request = request;
        this.response = response;
        this.log = this.applicationContext.log.child({name: `http`, method: this.request.method,
                                                      path: this.request.url.pathname });
    }

    get resources(): IResourceManager {
        return this._resources;
    }

    get applicationContext(): IApplicationContext { // Supports the Interface
        return this._applicationContext;
    }

    static create(context: IApplicationContext, request: IHttpRequest, response: IHttpResponse): IHttpContext {
        return new DefaultHttpContext(context, request, response);
    }
}

