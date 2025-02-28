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
import { ClassType, getConfig, IClassOptions } from "./Gestae";
import { ILogger } from "./Logger";

export interface IPart {
    get name(): string;
    add(child: ClassType | string): IPart;
    initialize(): Promise<void>;
    finalize(): Promise<void>;
}

export interface IPartOptions extends IClassOptions {
    name?: string;
}

export abstract class AbstractPart<O extends IPartOptions> implements IPart {
    private   readonly _children: Map<string, AbstractPart<any>> = new Map<string, AbstractPart<any>>();
    protected readonly context:   IApplicationContext;
    protected readonly model:     ClassType;
    protected readonly options?:  O;
    protected readonly log:       ILogger;
    protected          parent?:   AbstractPart<any>;

    constructor(model: ClassType, context: IApplicationContext, options?: O) {
        this.model = model;
        this.context = context;
        this.options = (options ?? {}) as O;
        this.options.name = this.options.name ?? this.constructor.name.toLowerCase();
        this.log = this.context.log.child({name: this.options.name});
    }

    get name(): string {
        return this.options!.name!;
    }

    get children(): Map<string, AbstractPart<any>> {
        return this._children;
    }

    getInstance<T extends Object>(...args: any[]): T {
        this.log.debug(`Creating instance of ${this.model.name} with args: ${args}`);
        return new this.model(...args) as T;
    }

    add(child: ClassType | string): IPart {
        const _result = this.context.partFactory.create(child);
        this.insert(_result.top);
        return _result.bottom ?? _result.top;
    }

    insert(child: AbstractPart<any>): void {
        child.parent = this;
        this.children.set(child.name,  child);
    }

    abstract _initialize(): Promise<void>;
    abstract _finalize(): Promise<void>;

    protected async emitBeforeInitializeEvent(): Promise<void> {
        //
    }

    protected async emitInitializeEvent(): Promise<void> {
        //
    }

    protected async emitAfterInitializeEvent(): Promise<void> {
        //
    }

    async initialize(): Promise<void> {
        this.log.debug(`Initializing ${this.constructor.name} ${this.name}.`);

        // Load the features (instance specific configurations) for this part.
        const _instance = this.getInstance();
        this.context.featureFactory.apply(this, _instance);

        await this.emitBeforeInitializeEvent();
        await this.emitInitializeEvent();
        await this._initialize();
        for(const child of this.children.values()) {
            await child.initialize();
        }
        await this.emitAfterInitializeEvent();
        this.log.debug(`${this.constructor.name} ${this.name} initialized.`);
    }

    async finalize(): Promise<void> {
        this.log.debug(`Finalizing ${this.constructor.name} ${this.name}.`);
        for(const child of this.children.values()) {
            await child.finalize();
        }
        this._finalize();
        this.log.debug(`${this.constructor.name} ${this.name} finalized.`);
    }
}