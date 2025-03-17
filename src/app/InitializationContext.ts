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

import { AbstractFeatureFactoryChain } from "../node/AbstractFeatureFactoryChain";
import { AbstractNodeFactoryChain } from "../node/AbstractNodeFactoryChain";
import { ILogger } from "../log/ILogger";
import { IApplicationContext } from "./IApplicationContext";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IInitializationContextOptions {
    //
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