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
    hasOptionData, 
    IClassOptions, 
    isClassConstructor, 
    setClassOptions
} from "./Gestae";
import { 
    IEventOptions, 
    HttpEvent, 
    setEventConfig
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { SchemaObject } from "ajv";
import { IResourceOptions, ResourcePart } from "./Resource";

const SCHEMA_OPTION_KEY = "gestaejs:schema";

/**
 * @description Input/Output Schema definitions
 */
export interface IIOSchema {
    input?: SchemaObject;
    output: SchemaObject;
};

/**
 * @description Interface for defining the payload schema of a plain-old object in Gestae.
 */
export interface ISchemaOptions extends IClassOptions {
    scheme?: SchemaObject | IIOSchema;
    validate?: boolean;
}

/**
 * @description Events emitted by a schema.
 */
export const SchemaEvents = defineEvents(
    ["validate"],
    ["before", "on", "after", "error"]
);

/**
 * @description Event for payload validations.
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
 */
export function Schema(options: ISchemaOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        setClassOptions(target, SCHEMA_OPTION_KEY, options);
    };
}

export class SchemaFeatureFactory extends AbstractFeatureFactoryChain<ResourcePart> {
    isFeatureFactory<T extends Object>(part: ResourcePart, target: T): boolean {
        return hasOptionData(target, SCHEMA_OPTION_KEY);
    }

    _apply<T extends Object>(part: ResourcePart, target: T): void {
        //
    }
}

export function OnSchemaEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SchemaEvent<E>) => void>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnAsyncSchemaEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SchemaEvent<E>) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}