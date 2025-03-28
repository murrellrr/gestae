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

import { SchemaObject } from "ajv";
import { EventRegisterType, IEventOptions, setEventMetadata } from "../../events/GestaeEvent";
import { GestaeObjectType, IOptions, setClassMetadata } from "../../Gestae";
import { SchemaEvent } from "./SchemaEvent";
import { IIOSchema } from "./IIOSchema";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const SCHEMA_METADATA_KEY = "gestaejs:schema";

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
        setClassMetadata(target, SCHEMA_METADATA_KEY, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnSchemaEvent<E extends GestaeObjectType>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SchemaEvent<E>) => void>) {
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncSchemaEvent<E extends GestaeObjectType>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SchemaEvent<E>) => Promise<void>>) {
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.