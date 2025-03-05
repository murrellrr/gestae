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

/**
 * @description _GESTAE_METADATA contains all the meta-data set by decorators in Gestate
 */
const _GESTAE_METADATA: Record<string, any> = {};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getGestaeMetadata = (): Record<string, any> => {
    return _GESTAE_METADATA;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type ClassType = new (...args: any[]) => any;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IOptions {
    $overloads?: boolean;
    [key: string]: any;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type HeaderValue = string[] | string | undefined;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export enum HttpMethodEnum {
    GET         = "get",
    POST        = "post",
    PUT         = "put",
    DELETE      = "delete",
    PATCH       = "patch",
    OPTIONS     = "options",
    HEAD        = "head",
    UNSUPPORTED = "unsupported"
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface Cookie {
    name: string;
    value: string;
    expires?: moment.Moment;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
function getTarget(target: Function | Object): Record<string, any> | undefined {
    return _GESTAE_METADATA[(typeof target === "function")? target.name : target.constructor.name];
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
function setTarget(target: Function | Object): Record<string, any> {
    const _name  = (typeof target === "function")? target.name : target.constructor.name;
    const _super = (typeof target === "function") ? Object.getPrototypeOf(target) : Object.getPrototypeOf(target.constructor);
    let _target = _GESTAE_METADATA[_name];
    if(!_target) {
        _target = {
            $name: _name,
        };
        if(_super?.name && _super !== Object) _target.$extends = _super.name;
        _GESTAE_METADATA[_name] = _target;
    }
    return _target;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
function getsertTarget(target: Function | Object): Record<string, any> {
    let _target = getTarget(target);
    if(!_target) _target = setTarget(target);
    return _target;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const hasMetadata = (target: Function | Object, key: string): boolean => {
    const _target = getTarget(target);
    return (!_target)? false : _target.hasOwnProperty(key);
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getMetadata = (target: Function | Object, key: string, 
                            defaultValue: Record<string, any> | undefined = undefined): Record<string, any> | undefined => {
    const _target = getTarget(target);
    // Get the key'd meta-data and return | defaultValue
    if(!_target) return defaultValue;
    let _metadata = _target[key];
    return (!_metadata)? defaultValue : _metadata;
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getsertMetadata = (target: Function | Object, key: string, 
                                defaultValue: Record<string, any> = {}): Record<string, any> => {
    const _target = getsertTarget(target);
    // Get the key'd meta-data and return | defaultValue
    let _metadata = _target[key];
    if(!_metadata) {
        _metadata = defaultValue;
        _target[key] = _metadata;
    }
    return _metadata;
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setMetadata = (target: Function | Object, key: string, data: Record<string, any>): void => {
    const _target = getsertTarget(target);
    _target[key] = data;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteMetadata = (target: Function | Object, key: string): void => {
    const _target = getTarget(target);
    if(_target) delete _target[key];
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const isClassConstructor = (target: any): target is new (...args: any[]) => any => {
    return (
        typeof target === "function" &&
        target.prototype &&
        typeof target.prototype === "object" &&
        Object.getOwnPropertyDescriptor(target, "prototype") !== undefined
    );
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const isPlainOleObject = (target: unknown): target is Record<string, any> => {
    return typeof target === "object" && target !== null && target.constructor === Object;
}