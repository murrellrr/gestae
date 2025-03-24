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

import { InitializationContext } from "../application/InitializationContext";
import { 
    GestaeClassType, 
    GestaeObjectType 
} from "../Gestae";
import { MethodNotAllowedError } from "../error/MethodNotAllowedError";
import { NotFoundError } from "../error/NotFoundError";
import { createEventPath, GestaeEvent } from "../events/GestaeEvent";
import { HttpContext } from "../http/HttpContext";
import { INodeOptions, INode } from "./INode";
import { FinalizationContext } from "../application/FinalizationContext";
import { HttpEvent, HttpEvents } from "../http/HttpEvent";
import { IHttpContext } from "../http/IHttpContext";
import { IContext } from "../context/IContext";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractNode<O extends INodeOptions> implements INode {
    public             uri:       string = "";
    protected readonly _children: Map<string, AbstractNode<any>> = new Map<string, AbstractNode<any>>();
    protected readonly options:   O;
    protected readonly _model:    GestaeClassType<any>;
    protected          parent?:   AbstractNode<any>;
    protected readonly _name:     string;

    constructor(model: GestaeClassType<any>, options?: O) {
        this._model  = model;
        this.options = (options ?? {}) as O;
        this._name   = this.options.name?.toLowerCase() ?? this.constructor.name.toLowerCase();
    }

    get model(): GestaeClassType<any> {
        return this._model;
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
        return `${this.type}:${this.uri}`;
    }

    add(child: AbstractNode<any>): AbstractNode<any> {
        child.parent = this;
        this._children.set(child.name, child);
        return child;
    }

    abstract get type(): string;

    getInstance<T extends GestaeObjectType>(...args: any[]): T {
        return new this.model(...args);
    }

    getNodeContext(context: IHttpContext): IContext {
        return context.getSubContext(this.fullyQualifiedPath);
    }

    public async beforeInitialize(context: InitializationContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    }

    public async afterInitialize(context: InitializationContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    }

    public async beforeFinalize(context: FinalizationContext): Promise<void> {
        // do nothing, developers, override this method to take custom action.
    };

    public async afterFinalize(context:  FinalizationContext): Promise<void> {
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
        //context.featureFactory.apply(this, this.getInstance());
        context.featureFactory.apply(this);
    }

    public async initialize(context: InitializationContext): Promise<void> {
        await this.beforeInitialize(context);
        this.generateURI();
        // Applying features.
        await this.applyFeatures(context);
        for(const child of this.children.values()) {
            await child.initialize(context);
        }
        await this.afterInitialize(context);
    }

    public async emitEvent(context: HttpContext, event: GestaeEvent) {
        await context.applicationContext.eventEmitter.emit(event);
    }

    public async emitHttpPathEvent(context: HttpContext, event: string, uriPostfix?: string): Promise<void> {
        const _uri = (uriPostfix)? `${this.uri}:${uriPostfix}` : this.uri;
        const _event = new HttpEvent<INode>(context, this, 
            createEventPath({topic: context.request.method, operation: _uri, action: event}, 
                            HttpEvents.operation));
        await this.emitEvent(context, _event);
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

    public async doRequest(context: HttpContext): Promise<void> {
        let _nodeName = context.request.uriTree.leaf;
        // defensive coding, make sure WE ARE INDEED the node to process this leaf.
        if(this.name !== _nodeName) // Check to see if we are the node.
            throw new NotFoundError(this.name, `The requested resource '${this.name}' was not found in path ${context.request.url}.`);
        // Check to see if we are the endpoint.
        if(context.request.uriTree.target && !this.endpoint)
            throw new MethodNotAllowedError(`The ${this.constructor.name} '${this.name}' is not an endpoint.`);

        // emit the before path event.
        await this.emitHttpPathEvent(context, HttpEvents.before); 

        context.current = this; // set us as the current node.
        await this.beforeRequest(context);
        if(!context.skipped){
            // emit the on path event.
            await this.emitHttpPathEvent(context, HttpEvents.on); // emit the path event.
            await this.onRequest(context);
        }
        else 
            context.log.debug(`Skipping from ${this.name} on ${this.uri} to ${context.request.uriTree.peek}.`);
    
        if(context.request.uriTree.hasNext) {
            // We need to continue processing children
            let _next = context.request.uriTree.next;

            // Get the next child.
            const _child = this.children.get(_next!); // validated above.
            if(!_child)
                throw new NotFoundError(_next, `The requested child resource '${_next}' was not found in path ${context.request.url}.`);

            // intercept errors on doRequest.
            await _child.doRequest(context);
            context.current = this; // set us back as the current node.
        }

        // emit the afterRequest event.
        await this.afterRequest(context);
        // emit the after path event.
        await this.emitHttpPathEvent(context, HttpEvents.after);
    }

    public async finalize(context: FinalizationContext): Promise<void> {
        await this.beforeFinalize(context);
        for(const child of this.children.values()) {
            await child.finalize(context);
        }
        await this.afterFinalize(context);
    }
}