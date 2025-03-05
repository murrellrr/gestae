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
import { HttpMethodEnum } from "./Gestae";
import { 
    GestaeError, 
    MethodNotAllowedError 
} from "./GestaeError";
import { 
    DefaultHttpContext,
    IHttpContext
} from "./HttpContext";
import { IHttpRequest, HttpRequest } from "./HttpRequest";
import { IHttpResponse, HttpResponse } from "./HttpResponse";
import { AbstractNode } from "./Node";
import http from "node:http";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractHttpRequestHandler {
    constructor(
        public readonly context: IApplicationContext,
        public readonly root:    AbstractNode<any>
    ) {}

    protected abstract createHttpContext(req: IHttpRequest, res: IHttpResponse): IHttpContext;

    protected abstract handleError(httpc: IHttpContext, error?: any): Promise<void>;

    protected abstract processRequest(httpc: IHttpContext): Promise<void>;

    async handleRequest(req: http.IncomingMessage, 
                        res: http.ServerResponse): Promise<void> {
        // handle the incomming request like a champ!
        const _req   = new HttpRequest(req);
        const _res   = new HttpResponse(res);
        const _https = this.createHttpContext(_req, _res);

        try {
            await this.processRequest(_https);
        }
        catch(error) {
            await this.handleError(_https);
        }
        finally {
            _res.write();
        }
    }
}

export class DefaultHttpRequestHandler extends AbstractHttpRequestHandler {

    createHttpContext(req: IHttpRequest, res: IHttpResponse): IHttpContext {
        return DefaultHttpContext.create(this.context, req, res);
    }

    protected async handleError(httpc: IHttpContext, error?: any): Promise<void> {
        const _error = GestaeError.toError(error);
        httpc.log.error(`Error processing ${httpc.request.method} request ${httpc.request.url}:`);
        httpc.log.error(JSON.stringify(_error, null, 2));
        httpc.response.error(_error);
    }

    protected async processRequest(httpc: IHttpContext): Promise<void> {
        if(httpc.request.method === HttpMethodEnum.UNSUPPORTED)
            this.handleError(httpc, new MethodNotAllowedError(httpc.request.method));
        else {
            await this.root.doRequest(httpc);
            if(httpc.request.canceled) this.handleError(httpc, httpc.request.cause);
            else {
                httpc.log.info(`Request processed with response code ${httpc.response.code}.`);
                if(this.context.log.level === "debug")
                    httpc.log.debug(`Response: \r\n${JSON.stringify(httpc.response.body, null, 2)}`);
            }
        }
    }

    static create(context: IApplicationContext, root: AbstractNode<any>): AbstractHttpRequestHandler {
        return new DefaultHttpRequestHandler(context, root);
    }
}