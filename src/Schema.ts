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

import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { 
    defineEvents,
    EventRegisterType,
    hasMetadata,
    IOptions,
    setMetadata
} from "./Gestae";
import { 
    IEventOptions, 
    HttpEvent, 
    setEventConfig
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { SchemaObject } from "ajv";
import { AbstractNode } from "./AbstractNode";

const SCHEMA_OPTION_KEY = "gestaejs:schema";

/**
 * @description Input/Output Schema definitions
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IIOSchema {
    input?: SchemaObject;
    output: SchemaObject;
};

/**
 * @description Interface for defining the payload schema of a plain-old object in Gestae.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ISchemaOptions extends IOptions {
    scheme?: SchemaObject | IIOSchema;
    validate?: boolean;
}

/**
 * @description Events emitted by a schema.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const SchemaEvents = defineEvents(
    ["validate"],
    ["before", "on", "after", "error"]
);

/**
 * @description Event for payload validations.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SchemaEvent<T> extends HttpEvent<T> {
    public readonly schema?: SchemaObject;
    public readonly results?: any;

    constructor(context: IHttpContext, data: T, schema?: SchemaObject) {
        super(context, data);
        this.schema = schema;
    }
}

/**
 * @description Decorator for defining the payload schema of a plain-old object in Gestae.
 * @param options 
 * @returns Decorator function
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function Schema(options: ISchemaOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.scheme = options.scheme ?? {};
        options.validate = (Object.keys(options.scheme).length === 0)? false: options.validate ?? true;
        options.$overloads = options.$overloads ?? true;
        setMetadata(target, SCHEMA_OPTION_KEY, options);
    };
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SchemaFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory<T extends Object>(node: AbstractNode<any>, target: T): boolean {
        return hasMetadata(target, SCHEMA_OPTION_KEY);
    }

    _apply<T extends Object>(node: AbstractNode<any>, target: T): void {
        //deleteMetadata(node.model, SCHEMA_OPTION_KEY);
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnSchemaEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SchemaEvent<E>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncSchemaEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SchemaEvent<E>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}