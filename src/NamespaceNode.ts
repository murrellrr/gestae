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

import { 
    ClassType,
    getsertMetadata,
    hasMetadata,
} from "./Gestae";
import { 
    formatEvent,
} from "./GestaeEvent";
import { GestaeError } from "./GestaeError";
import { 
    AbstractNodeFactoryChain, 
    FactoryReturnType 
} from "./AbstractNodeFactoryChain";
import { NodeTemplate } from "./NodeTemplate";
import { AbstractTaskableNode } from "./TaskNode";
import _ from "lodash";
import { HttpContext } from "./HttpContext";
import { 
    INamespaceOptions, 
    NAMESPACE_METADATA_KEY 
} from "./Namespace";
import { 
    INamesapceNode, 
    NamespaceEvent, 
    NamespaceEvents 
} from "./NamespaceEvent";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NamespaceNode extends AbstractTaskableNode<INamespaceOptions> implements INamesapceNode {
    constructor(public readonly instance: Object, options: INamespaceOptions = {}) {
        super(options);
        options.name = options.name ?? this.constructor.name.toLowerCase();
        options.traversable = options.traversable ?? true;
        options.$overloads = options.$overloads ?? true;
    }

    get type(): string {
        return "namespace";
    }

    getInstance<T extends Object>(): T {
        return this.instance as T;
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        const _event = new NamespaceEvent(context, this);
        _event.path = `${this.fullyQualifiedPath}:${formatEvent(NamespaceEvents.Traverse.OnBefore)}`;
        context.log.debug(`Emitting event '${_event.path}'.`);
        await this.emitEvent(context, _event, this.instance);
    }

    public async onRequest(context: HttpContext): Promise<void> {
        const _event = new NamespaceEvent(context, this);
        _event.path = `${this.fullyQualifiedPath}:${formatEvent(NamespaceEvents.Traverse.On)}`;
        context.log.debug(`Emitting event '${_event.path}'.`);
        await this.emitEvent(context, _event, this.instance);
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        const _event = new NamespaceEvent(context, this);
        _event.path = `${this.fullyQualifiedPath}:${formatEvent(NamespaceEvents.Traverse.OnAfter)}`;
        context.log.debug(`Emitting event '${_event.path}'.`);
        await this.emitEvent(context, _event, this.instance);
    }

    public static create(aClass: ClassType | string, options: INamespaceOptions = {}): NamespaceNode {
        if(typeof aClass === "string") {
            const _result = NamespaceNodeFactory.createFromString(aClass);
            return _result.bottom ?? _result.top;
        }
        else {
            const _instance = new aClass([]);
            return new NamespaceNode(_instance, getsertMetadata(_instance, NAMESPACE_METADATA_KEY, options));
        }
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
class DefaultNameSpace {
    static getInstance(): Object {
        return new DefaultNameSpace();
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NamespaceNodeFactory extends AbstractNodeFactoryChain<INamespaceOptions, NamespaceNode> {
    isNodeFactory(target: NodeTemplate): boolean {
        return target.isString || 
               (target.isClass && hasMetadata(target.node, NAMESPACE_METADATA_KEY));
    }

    onCreate(target: NodeTemplate): FactoryReturnType<INamespaceOptions, NamespaceNode> {
        this.log.debug(`Creating namespace '${target.name}'`);
        if(target.isString)
            return NamespaceNodeFactory.createFromString((target.node as string));
        else 
            return { top: NamespaceNode.create((target.node as ClassType)) };
    }

    public static createFromDelimString(target: string, options: INamespaceOptions = {}): FactoryReturnType<INamespaceOptions, NamespaceNode> {
        const _nodes = target.split("/").filter(p => p.length > 0);

        let _parent:  NamespaceNode | undefined;
        let _current: NamespaceNode | undefined;
        let _first:   NamespaceNode | undefined;
        for(const _node of _nodes) {
            let _options = _.cloneDeep(options);
            _options.name = _node.trim().toLowerCase();
            _current = new NamespaceNode(DefaultNameSpace.getInstance(), _options);
            if(!_first) _first = _current;
            if(_parent) _parent.add(_current);
            _parent = _current;
        }
        return { top: _first!, bottom: _current };
    }

    public static createFromString(target: string, options: INamespaceOptions = {}): FactoryReturnType<INamespaceOptions, NamespaceNode> {
        target = target.trim();
        if(target.length === 0)
            throw GestaeError.toError("Namespace name cannot be empty.");
        return NamespaceNodeFactory.createFromDelimString(target, options);
    }
}

