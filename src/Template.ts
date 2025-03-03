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
import { 
    ClassType, 
    isClassConstructor 
} from "./Gestae";
import { AbstractPart } from "./AbstractPart";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type PartTemplateType = AbstractPart<any> | ClassType | string;

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ITemplate {
    get name(): string;
    add(child: PartTemplateType): ITemplate;
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class Template implements ITemplate {
    private readonly _base:     PartTemplateType;
    private readonly _children: Map<string, Template> = new Map();
    private readonly _name:     string;

    constructor(base: PartTemplateType, name?: string) {
        this._base = base;
        this._name = name ?? Template.toName(this._base);
    }

    /**
     * @returns The name of the template derrived from base type or string.
     */
    get name() {
        return this._name;
    }

    /**
     * @returns The base object type, Part, or string.
     */
    get base() {
        return this._base;
    }

    get isString(): boolean {
        return typeof this._base === "string"; 
    }

    get isClass(): boolean {
        return isClassConstructor(this._base);
    }

    get isAbstractPart(): boolean {
        return this._base instanceof AbstractPart;
    }

    add(child: PartTemplateType): ITemplate {
        const _name = Template.toName(child);
        let _template = this._children.get(_name);
        if(!_template) {
             _template = new Template(child, _name);
             this._children.set(_name, _template);
        }
        return _template;
    }

    /**
     * @description Converta the template to a part using the AbstractPartChainFactory and applies features 
     *              using the AbstractFeatureChainFactory..
     * @param context The initialization context for the application.
     * @returns The top-level part of the template.
     */
    async convert(context: InitializationContext): Promise<AbstractPart<any>> {
        const _log = context.applicationContext.log.child({name: `${this.constructor.name}.convert:${this.name}`});
        _log.debug(`Converting template '${this.name}'...`);

        // Checking to see if the base is a part.
        const _result = context.partFactory.create(this);
        const _part   = _result.bottom ?? _result.top;

        // Converting child templates.
        _log.debug(`Converting ${this._children.size} child templates...`);
        for(const child of this._children.values()) {
            _log.debug(`Converting template ${child.name} and adding to part '${_part.name}'.`);
            _part.add(await child.convert(context));
        }
        _log.debug(`${this._children.size} child templates converted.`);

        _log.debug(`Template '${this.name}' converted to ${_part.constructor.name} '${_part.name}'.`);
        return _result?.top ?? _part;
    }

    /**
     * @description Conversta a PartTemplateType to a string name. 
     *              1. If an instance of AbstractPart then AbstractPart.name is used. 
     *              2. If a class constructor, the the lower-cased constructor name is used.
     *              3. If a string, then the lower-cased string is used.
     * @param base The PartTemplateType
     * @returns a string name for the PartTemplateType.
     */
    static toName(base: PartTemplateType): string {
        if(base instanceof AbstractPart) return base.name;
        else if(isClassConstructor(base)) return base.name.toLowerCase();
        else return base.toLowerCase();
    }
}