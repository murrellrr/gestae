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

import { IApplicationContext } from "../app/IApplicationContext";
import { GestaeError } from "../error/GestaeError";
import { ILogger } from "../log/ILogger";
import { AbstractNode } from "./AbstractNode";
import { INodeOptions } from "./INode";
import { NodeTemplate } from "./NodeTemplate";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type FactoryReturnType<O extends INodeOptions, P extends AbstractNode<O>> = {
    top: P;
    bottom?: P;
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractNodeFactoryChain<O extends INodeOptions, P extends AbstractNode<O>> {
    protected          context: IApplicationContext;
    protected readonly log:     ILogger;
    private            link?:   AbstractNodeFactoryChain<any, any>;

    constructor(context: IApplicationContext, link?: AbstractNodeFactoryChain<any, any>) {
        this.context = context;
        this.log     = this.context.log;
        this.link    = link;
    }

    add(link: AbstractNodeFactoryChain<any, any>) {
        if(!this.link) this.link = link;
        else this.link.add(link);
    }

    abstract isNodeFactory(target: NodeTemplate): boolean;

    abstract onCreate(target: NodeTemplate, bindings?: Record<string, any>): FactoryReturnType<O, P>;

    create(target: NodeTemplate, bindings: Record<string, any> = {}): FactoryReturnType<O, P> {
        if(target.isNode)
            return {top: target.node as P};
        if(this.isNodeFactory(target)) 
            return this.onCreate(target, bindings);
        else if(this.link) 
            return this.link.create(target, bindings);
        else 
            throw GestaeError.toError(`Cannot create node for target ${target.name}.`);
    }
}