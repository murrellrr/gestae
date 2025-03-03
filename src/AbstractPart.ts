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

import { InitializationContext } from "./ApplicationContext";
import { IOptions } from "./Gestae";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IPart {
    get name(): string;
    add(child: AbstractPart<any>): AbstractPart<any>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IPartOptions extends IOptions {
    name?: string;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractPart<O extends IPartOptions> implements IPart {
    private   readonly _children: Map<string, AbstractPart<any>> = new Map<string, AbstractPart<any>>();
    protected readonly options?:  O;
    protected          parent?:   AbstractPart<any>;

    constructor(options?: O) {
        this.options = (options ?? {}) as O;
        this.options.name = this.options.name?.toLowerCase() ?? this.constructor.name.toLowerCase();
    }

    get name(): string {
        return this.options!.name!;
    }

    get children(): Map<string, AbstractPart<any>> {
        return this._children;
    }

    get isEndpoint(): boolean {
        return false;
    }

    add(child: AbstractPart<any>): AbstractPart<any> {
        child.parent = this;
        this._children.set(child.name, child);
        return child;
    }

    abstract getInstance<T extends Object>(): T;

    abstract _initialize(context: InitializationContext): Promise<void>;
    abstract _finalize(): Promise<void>;

    async initialize(context: InitializationContext): Promise<void> {
        const _log = context.applicationContext.log.child({name: `${this.constructor.name}:${this.name}`});
        _log.debug(`Initializing ${this.constructor.name} '${this.name}'...`);

        await this._initialize(context);
        for(const child of this.children.values()) {
            await child.initialize(context);
        }
        _log.debug(`${this.constructor.name} '${this.name}' initialized.`);
    }

    async finalize(): Promise<void> {
        //this.log.debug(`Finalizing ${this.constructor.name} '${this.name}'.`);
        for(const child of this.children.values()) {
            await child.finalize();
        }
        this._finalize();
        //this.log.debug(`${this.constructor.name} '${this.name}' finalized.`);
    }
}