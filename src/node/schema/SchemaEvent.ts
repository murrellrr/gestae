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
import { HttpEvent } from "../../http/HttpEvent";
import { IHttpContext } from "../../http/IHttpContext";
import { EventRegisterType } from "../../events/GestaeEvent";
import { GestaeObjectType } from "../../Gestae";

/**
 * @description Events emitted by a schema.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const SchemaEvents = {
    before: "before" as string,
    on:     "on"     as string,  
    after:  "after"  as string,
    Validate: {
        operation: "validate" as string,
        OnBefore: {operation: "validate", action: "before"} as EventRegisterType,
        On:       {operation: "validate", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "validate", action: "after" } as EventRegisterType,
    }
};

/**
 * @description Event for payload validations.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SchemaEvent<T extends GestaeObjectType> extends HttpEvent<T> {
    public readonly schema?: SchemaObject;
    public readonly results?: any;

    constructor(context: IHttpContext, data: T, schema?: SchemaObject) {
        super(context, data);
        this.schema = schema;
    }
}