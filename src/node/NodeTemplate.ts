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

import { InitializationContext } from "../app/InitializationContext";
import { 
    GestaeClassType, 
    IOptions, 
    isClassConstructor 
} from "../Gestae";
import { AbstractNode } from "./AbstractNode";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type NodeTemplateType = AbstractNode<any> | GestaeClassType | string;

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface INodeTemplate {
    get name(): string;
    get bindings(): Record<string, any>;
    addTemplate(template: NodeTemplateType, options?: Record<string, any>): INodeTemplate;
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NodeTemplate implements INodeTemplate {
    private readonly _node:     NodeTemplateType;
    private readonly _children: Map<string, NodeTemplate> = new Map();
    public  readonly name:      string;
    public  readonly bindings:  IOptions = {};

    constructor(node: NodeTemplateType, name: string, bindings: Record<string, any> = {}) {
        this._node    = node;
        this.name     = bindings.name ?? name;
        this.bindings = bindings;
    }

    /**
     * @returns The node object type, Node, or string.
     */
    get node() {
        return this._node;
    }

    get isString(): boolean {
        return typeof this._node === "string"; 
    }

    get isClass(): boolean {
        return isClassConstructor(this._node);
    }

    get isNode(): boolean {
        return this._node instanceof AbstractNode;
    }

    addTemplate(child: NodeTemplateType, bindings: Record<string, any> = {}): INodeTemplate {
        const _name = bindings.name ?? NodeTemplate.toNodeName(child);
        let _template = this._children.get(_name);
        if(!_template) {
             _template = new NodeTemplate(child, _name, bindings);
             this._children.set(_name, _template);
        }
        return _template;
    }

    /**
     * @description Converta the template to a node using the AbstractNodeChainFactory and applies features 
     *              using the AbstractFeatureChainFactory..
     * @param context The initialization context for the application.
     * @returns The top-level node of the template.
     */
    async convert(context: InitializationContext): Promise<AbstractNode<any>> {
        // Checking to see if the base is a node.
        const _result = context.nodeFactory.create(this);
        const _node   = _result.bottom ?? _result.top;

        // Converting child templates.
        for(const child of this._children.values()) {
            _node.add(await child.convert(context));
        }

        context.applicationContext.log.debug(`Template '${this.name}' converted to ${_node.constructor.name} '${_node.name}'.`);
        return _result?.top ?? _node;
    }

    static create(node: NodeTemplateType) {
        return new NodeTemplate(node, NodeTemplate.toNodeName(node));
    }

    /**
     * @description Conversta a NodeTemplateType to a string name. 
     *              1. If an instance of AbstractNode then AbstractNode.name is used. 
     *              2. If a class constructor, the the lower-cased constructor name is used.
     *              3. If a string, then the lower-cased string is used.
     * @param base The NodeTemplateType
     * @returns a string name for the NodeTemplateType.
     */
    static toNodeName(base: NodeTemplateType): string {
        if(base instanceof AbstractNode) return base.name;
        else if(isClassConstructor(base)) return base.name.toLowerCase();
        else return base.toLowerCase();
    }
}