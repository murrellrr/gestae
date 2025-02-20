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
    AsyncEventEmitter, 
    IAsyncEventEmitter 
} from "./AsyncEventEmitter";
import { IAsyncEventQueue } from "./AsyncEventQueue";
import { 
    AbstractContext, 
    IContext 
} from "./Context";
import { ILogger } from "./Logger";
import { IProperties } from "./Properties";

export interface IApplicationContext extends IContext {
    get logger(): ILogger;
    get properties(): IProperties;
    get eventEmitter(): IAsyncEventEmitter;
    get eventQueue(): IAsyncEventQueue;
}

export class DefaultApplicationContext extends AbstractContext implements IApplicationContext {
    private readonly _logger: ILogger;
    private readonly _properties: IProperties;
    private readonly _events: AsyncEventEmitter;

    constructor(rootLogger: ILogger, properties: IProperties) {
        super();
        this._logger = rootLogger;
        this._properties = properties;
        this._events = new AsyncEventEmitter(this._logger); 
    }

    get logger(): ILogger {
        return this._logger;
    }

    get properties(): IProperties {
        return {} as IProperties;
    }

    get eventEmitter(): IAsyncEventEmitter {
        return this._events;
    }

    get eventQueue(): IAsyncEventQueue {
        return this._events;
    }

    static create(options: Record<string, any> = {logger: null, properties: null}) {
        return new DefaultApplicationContext(options.logger, options.properties);
    }
}