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
import { ListenerItem } from "./AsyncEventEmitter";
import { IAsyncEventQueue } from "./AsyncEventQueue";
import { 
    ClassType, 
    isClassConstructor 
} from "./Gestae";
import { GestaeEvent } from "./GestaeEvent";
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
export interface ITemplate extends IAsyncEventQueue {
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
    private readonly _listeners: ListenerItem[] = [];
    private readonly _base:     PartTemplateType;
    private readonly _children: Map<string, Template> = new Map<string, Template>();
    private readonly _name:     string;

    constructor(base: PartTemplateType, name?: string) {
        this._base = base;
        this._name = name ?? Template.toName(this._base);
    }

    get name() {
        return this._name;
    }

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

    /**
     * @description Register an event listener for a specific event type.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    on<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void, once: boolean = false) : this {
        this._listeners.push({event: event, method: method, once: once});
        return this;
    }

    /**
     * @description Register an event listener that will be called only once.
     * @param event - The name of the event.
     * @param handler - The async function to handle the event.
     */
    once<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void): this {
        this.on(event, method, true);
        return this;
    }

    /**
     * @description Remove a specific event listener.
     * @param event - The name of the event.
     * @param handler - The handler function to remove.
     */
    off<T, E extends GestaeEvent<T>>(event: string, listener: (event: E) => Promise<void> | void): this {
        //TODO: Do somthing here.
        return this;
    }

    add(child: PartTemplateType): ITemplate {
        const _name = Template.toName(child);
        let _template: Template;
        if(!this._children.has(_name)) {
            _template = new Template(child, _name);
            this._children.set(_name, _template);
        }
        else 
            _template = this._children.get(_name)!; // Just checked if it existed above.

        return _template;
    }

    private async applyFeatures(context: InitializationContext, part: AbstractPart<any>): Promise<void> {
        // Applying the features to the top-level part.
        const _log = context.applicationContext.log.child({name: `${this.constructor.name}.applyFeatures:${this.name}`});
        _log.debug(`Applying features to '${part.name}'...`);
        context.featureFactory.apply(part, part.getInstance());
        _log.debug(`Features applied to '${part.name}'.`);
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
        const _result = context.partFactory.create(this);
        const _part = _result.bottom ?? _result.top;

        // Add all event listeners to context.
        _log.debug(`Registering ${this._listeners.length} event listeners...`);
        for(const _item of this._listeners) {
            _log.debug(`Registering event listener for '${_item.event}'.`);
            context.applicationContext.eventQueue.on(_item.event, _item.method, _item.once);
        }
        _log.debug(`${this._listeners.length} event listeners registered.`);

        // Converting child templates.
        _log.debug(`Converting ${this._children.size} child templates...`);
        for(const child of this._children.values()) {
            _part.add(await child.convert(context));
        }
        _log.debug(`${this._children.size} child templates converted.`);

        // Applying features.
        await this.applyFeatures(context, _result.top);

        _log.debug(`Template '${this.name}' converted to ${_part.constructor.name} '${_part.name}'.`);
        return _result.top;
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