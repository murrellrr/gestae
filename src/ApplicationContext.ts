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
import { AbstractNodeFactoryChain } from "./AbstractNodeFactoryChain";
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

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IApplicationContextOptions {
    //
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IInitializationContextOptions {
    //
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IApplicationContext extends IContext {
    get log():            ILogger;
    get properties():     IProperties;
    get eventEmitter():   IAsyncEventEmitter;
    get eventQueue():     IAsyncEventQueue;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ApplicationContext extends AbstractContext implements IApplicationContext {
    public    readonly properties: IProperties;
    public    readonly log:        ILogger;
    private   readonly events:     AsyncEventEmitter;
    protected readonly options:    IApplicationContextOptions;
    
    constructor(log: ILogger, properties: IProperties, options: IApplicationContextOptions = {}) {
        super();
        this.options    = options;
        this.log        = log;
        this.properties = properties;
        this.events     = new AsyncEventEmitter(this.log); 
    }

    get eventEmitter(): IAsyncEventEmitter {
        return this.events;
    }

    get eventQueue(): IAsyncEventQueue {
        return this.events;
    }

    static create(log: ILogger, properties: IProperties, options: IApplicationContextOptions = {}) {
        return new ApplicationContext(log, properties, options);
    }
}

/**
 * @description Context used during initialization of the Templates and Nodes.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class InitializationContext {
    public readonly applicationContext: IApplicationContext;
    public readonly nodeFactory:        AbstractNodeFactoryChain<any, any>;
    public readonly featureFactory:     AbstractFeatureFactoryChain<any>;
    public readonly options:            IInitializationContextOptions;
    public readonly log:                ILogger;

    constructor(context: IApplicationContext, 
                nodeChain: AbstractNodeFactoryChain<any, any>, 
                featureChain: AbstractFeatureFactoryChain<any>, 
                options: IInitializationContextOptions = {}) {
        this.applicationContext = context;
        this.log                = context.log;
        this.nodeFactory        = nodeChain;
        this.featureFactory     = featureChain;
        this.options            = options;
    }

    static create(context: IApplicationContext, 
                  nodeChain: AbstractNodeFactoryChain<any, any>, 
                  featureChain: AbstractFeatureFactoryChain<any>, 
                  options: IInitializationContextOptions = {}): InitializationContext {
        return new InitializationContext(context, nodeChain, featureChain, options);
    }
}