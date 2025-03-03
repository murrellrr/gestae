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
import { GestaeError } from "./GestaeError";
import { ILogger } from "./Logger";
import { AbstractPart } from "./AbstractPart";
import { Template } from "./Template";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type FactoryReturnType<O extends Object, P extends AbstractPart<O>> = {
    top: P;
    bottom?: P;
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractPartFactoryChain<O extends Object, P extends AbstractPart<O>> {
    protected          context: IApplicationContext;
    protected readonly log:     ILogger;
    private            link?:   AbstractPartFactoryChain<any, any>;

    constructor(context: IApplicationContext, link?: AbstractPartFactoryChain<any, any>) {
        this.context = context;
        this.log = this.context.log.child({name: this.constructor.name});
        this.link = link;
    }

    add(link: AbstractPartFactoryChain<any, any>) {
        if(!this.link) this.link = link;
        else this.link.add(link);
    }

    abstract isPartFactory(target: Template): boolean;

    abstract _create(target: Template): FactoryReturnType<O, P>;

    create(target: Template): FactoryReturnType<O, P> {
        if(this.isPartFactory(target)) 
            return this._create(target);
        else if(this.link) 
            return this.link.create(target);
        else 
            throw GestaeError.toError("Cannot create part for target.");
    }
}