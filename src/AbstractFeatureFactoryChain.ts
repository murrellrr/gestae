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
import { AbstractNode } from "./Node";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractFeatureFactoryChain<P extends AbstractNode<any>> {
    protected context: IApplicationContext;
    protected log:      ILogger;
    private   _link?: AbstractFeatureFactoryChain<any>;
    
    constructor(context: IApplicationContext, link?: AbstractFeatureFactoryChain<any>) {
        this.context = context;
        this._link = link;
        this.log = this.context.log;
    }

    add(link: AbstractFeatureFactoryChain<any>) {
        if(!this._link) this._link = link;
        else this._link.add(link);
    }

    abstract isFeatureFactory<T extends Object>(node: P, target: T): boolean;

    abstract _apply<T extends Object>(node: P, target: T): void;

    apply<T extends Object>(node: P, target: T): void {
        if(this.isFeatureFactory(node, target))
            this._apply(node, target);
        if(this._link) 
            this._link.apply(node, target);
    }
}