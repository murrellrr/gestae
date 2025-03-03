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

import { GestaeError } from "./GestaeError";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IContext {
    getValue(key: string, defaultValue?: any): any;
    getInstance<T>(_Class: new (...args: any[]) => T, defaultValue?: T): T;
    setValue(key: string, value: any): void;
    setInstance<T>(_Class: new (...args: any[]) => T, value: T): void;
    contains(key: string): boolean;
    remove(key: string): void;
    readonly values: any[];
    readonly keys: string[];
    readonly entries: [string, any][];
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class AbstractContext implements IContext {
    private readonly _values: Record<string, any> = {};

    getValue(key:string, defaultValue?: any): any {
        return this._values[key] ?? defaultValue;
    }

    getInstance<T>(_Class: new (...args: any[]) => T, defaultValue?: T): T {
        const _value = this.getValue(_Class.name, defaultValue);
        if(!(_value instanceof _Class)) 
            throw new GestaeError(`Property ${_value.constructor.name} is not an instance of ${_Class.name}`);
        return _value;
    }

    setValue(key: string, value: any): void {
        this._values[key] = value;
    }

    setInstance<T>(_Class: new (...args: any[]) => T, value: T): void {
        if(!(value instanceof _Class))
            throw new GestaeError(`Parameter 'value' is not an instance of ${_Class.name}`);
        this.setValue(_Class.name, value);
    }

    contains(key: string): boolean {
        return this._values.hasOwnProperty(key);
    }

    remove(key: string): void {
        delete this._values[key];
    }

    get values(): any[] {
        return Object.values(this._values);
    }

    get keys(): string[] {
        return Object.keys(this._values);
    }   

    get entries(): [string, any][] {
        return Object.entries(this._values);
    }
}