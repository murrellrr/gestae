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
import { CancelError, GestaeError, NotFoundError } from "./GestaeError";
import { GestaeEvent } from "./GestaeEvent";
import { HttpContext } from "./HttpContext";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface INodeOptions extends IOptions {
    name?: string;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface INode {
    get name(): string;
    get type(): string;
    get parentNode(): INode | undefined;
    get childNodes(): Map<string, INode>;
    get fullyQualifiedPath(): string;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractNode<O extends INodeOptions> implements INode {
    private   readonly _children: Map<string, AbstractNode<any>> = new Map<string, AbstractNode<any>>();
    protected readonly options:   O;
    protected          parent?:   AbstractNode<any>;
    protected          uri:       string = "";
    protected readonly _name:     string;

    constructor(options?: O) {
        this.options = (options ?? {}) as O;
        this._name = this.options.name?.toLowerCase() ?? this.constructor.name.toLowerCase();
    }

    get name(): string {
        return this._name;
    }

    get parentNode(): INode | undefined {
        return this.parent;
    }

    get childNodes(): Map<string, INode> {
        return this._children as Map<string, INode>;
    }

    get children(): Map<string, AbstractNode<any>> {
        return this._children;
    }

    get endpoint(): boolean {
        return false;
    }

    get fullyQualifiedPath(): string {
        return `gestaejs:${this.type}:${this.uri}`;
    }

    add(child: AbstractNode<any>): AbstractNode<any> {
        child.parent = this;
        this._children.set(child.name, child);
        return child;
    }

    abstract get type(): string;

    abstract getInstance<T extends Object>(): T;

    public async beforeInitialize(context: InitializationContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    }

    public async afterInitialize(context: InitializationContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    }

    public async beforeFinalize(): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    };

    public async afterFinalize(): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    };

    /**
     * @description Generates the full hierarchical path by traversing up the parent chain.
     * @private
     */
    private generateURI(): void {
        let _path    = this.name;
        let _current = this.parent;
        while(_current) {
            _path    = `${_current.name}:${_path}`;
            _current = _current.parent;
        }
        this.uri = _path;
    }

    private async applyFeatures(context: InitializationContext): Promise<void> {
        // Applying the features to the top-level node.
        context.log.debug(`Applying features to '${this.name}'...`);
        context.featureFactory.apply(this, this.getInstance());
        context.log.debug(`Features applied to '${this.name}'.`);
    }

    public async initialize(context: InitializationContext): Promise<void> {
        context.log.debug(`Initializing ${this.constructor.name} '${this.name}'...`);
        await this.beforeInitialize(context);
        this.generateURI();
        // Applying features.
        await this.applyFeatures(context);
        for(const child of this.children.values()) {
            await child.initialize(context);
        }
        await this.afterInitialize(context);
        context.log.debug(`${this.constructor.name} '${this.name}' initialized on path '${this.fullyQualifiedPath}'.`);
    }

    protected async emitEvent(context: HttpContext, event: GestaeEvent<any>, instance?: object) {
        await context.applicationContext.eventEmitter.emit(event);
        if(event.cancled)
            context.cancel(event.cause);
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    };

    public async onRequest(context: HttpContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    };

    public async afterRequest(context: HttpContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    };

    public async doError(context: HttpContext, error: GestaeError): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    }

    public async doRequest(context: HttpContext): Promise<void> {
        let _nodeName = context.request.uri.node;
        // defensive coding.
        if(this.name !== _nodeName) // Check to see if we are the node.
            throw new NotFoundError(`The requested resource '${this.name}' was not found from path ${context.request.url}.`);

        context._currentNode = this; // set us as the current node.
        
        await this.beforeRequest(context);
        if(context.canceled) throw new CancelError(context.reason);
        
        if(!context.leapt(this.uri)) {
            await this.onRequest(context);
            if(context.canceled) throw new CancelError(context.reason);
        }
        else 
            context.log.debug(`Leap-frogging from ${this.name} on ${this.uri} to ${context.request.uri.peek}.`);
        
        if(!context.request.uri.target && context.request.uri.hasNext) {
            // We need to continue processing children
            let _next = context.request.uri.next;
            const _child = this.children.get(_next!); // validated above.
            if(!_child)
                throw new NotFoundError(_next, `The requested resource '${_next}' was not found from path ${context.request.url}.`);
            await _child.doRequest(context);
        }
        else if(!this.endpoint)
            throw new NotFoundError(this.name, `The ${this.constructor.name} '${this.name}' is not an endpoint.`);

        if(context.canceled) throw new CancelError(context.reason);

        if(!context.canceled) {
            context._currentNode = this; // set us as the current node.
            await this.afterRequest(context);
        }
    }

    public async finalize(): Promise<void> {
        //this.log.debug(`Finalizing ${this.constructor.name} '${this.name}'.`);
        await this.beforeFinalize();
        for(const child of this.children.values()) {
            await child.finalize();
        }
        await this.afterFinalize();
        //this.log.debug(`${this.constructor.name} '${this.name}' finalized.`);
    }
}