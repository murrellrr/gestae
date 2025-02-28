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

import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { AbstractPartFactoryChain } from "./AbstractPartFactoryChain";
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

export type PartChainFactoryType = (context: IApplicationContext) => AbstractPartFactoryChain<any, any>;
export type FeatureChainFactoryType = (context: IApplicationContext) => AbstractFeatureFactoryChain<any>;

export interface IApplicationContextOptions {
    log:                 ILogger;
    properties:          IProperties;
    partChainFactory:    PartChainFactoryType;
    featureChainFactory: FeatureChainFactoryType;
}

export interface IApplicationContext extends IContext {
    get log():            ILogger;
    get properties():     IProperties;
    get eventEmitter():   IAsyncEventEmitter;
    get eventQueue():     IAsyncEventQueue;
    get partFactory():    AbstractPartFactoryChain<any, any>;
    get featureFactory(): AbstractFeatureFactoryChain<any>;
}

export class DefaultApplicationContext extends AbstractContext implements IApplicationContext {
    private   readonly _properties:    IProperties;
    private   readonly _events:        AsyncEventEmitter;
    protected readonly options:        IApplicationContextOptions;
    public    readonly log:            ILogger;
    public    readonly partFactory:    AbstractPartFactoryChain<any, any>;
    public    readonly featureFactory: AbstractFeatureFactoryChain<any>;

    constructor(options: IApplicationContextOptions) {
        super();
        this.options = options;
        this.log = this.options.log.child({name: this.constructor.name});
        this._properties = this.options.properties;
        this._events = new AsyncEventEmitter(this.log); 
        this.partFactory = options.partChainFactory(this);
        this.featureFactory = options.featureChainFactory(this);
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

    static create(options: IApplicationContextOptions) {
        return new DefaultApplicationContext(options);
    }
}