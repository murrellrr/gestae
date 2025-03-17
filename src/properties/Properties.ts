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

import { AbstractPropertyFactory } from "./AbstractPropertyFactory";
import { IProperties } from "./IProperties";
import { IPropertyManager } from "./IPropertyManager";
import moment from "moment";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IPropertyOptions {
    cache?: boolean;
    cacheExpirySec?: number;
}

/**
 * @description Class for managing properties.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class Properties implements IProperties, IPropertyManager {
    constructor(protected readonly factory: AbstractPropertyFactory<any>) {}

    addLink(factory: AbstractPropertyFactory<any>): void {
        this.factory.add(factory);
    }

    /**
     * @description Get a property value from its origin. If the key is not found, it will return the defaultValue.
     *              If the value is not valid, it will return the defaultValue.
     * @param key          The key of the property to get.
     * @param defaultValue The default value to return if the key is not found or the value is not valid.
     * @param validator    A function to validate the value. If the value is not valid, it will return the defaultValue.
     * @param transformer  A function to transform the value. If the value is not valid, it will return the defaultValue.
     * @returns The poroperty value from its origin, the defaultValue if key was not found, or null.
     */
    async get<T>(key: string, defaultValue: T | undefined, validator?: (value: any) => boolean,
                 transformer?: (value: any) => T): Promise<T | undefined> {
        let _value = await this.factory.get(key);
        if(validator && !validator(_value)) return defaultValue;
        if(validator) _value = validator(_value) ? _value : defaultValue;
        return transformer ? transformer(_value) : _value;
    }

    async object<T>(key: string, defaultValue?: T, reviver?: (this: T, key: string, value: any) => T): Promise<T> {
        return this.get(key, defaultValue, undefined, value => JSON.parse(value, reviver));
    }

    async string(key: string, defaultValue?: string): Promise<string | undefined> {
        return this.get(key, defaultValue);
    }

    async number(key: string, defaultValue?: number): Promise<number | undefined> {
        return this.get(key, defaultValue, undefined, (value) => Number(value));
    }

    async boolean(key: string, defaultValue?: boolean): Promise<boolean | undefined> {
        return this.get(key, defaultValue,undefined, (value) => Boolean(value));
    }

    async dateTime(key: string, defaultValue?: moment.Moment): Promise<moment.Moment | undefined> {
        return this.get(key, defaultValue, undefined, (value) => moment(value));
    }
}