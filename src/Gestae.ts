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

import { IApplicationContext } from "./application/IApplicationContext";
import { EventFeatureFactory } from "./events/EventFeatureFactory";
import { AbstractFeatureFactoryChain } from "./node/AbstractFeatureFactoryChain";
import { AbstractNodeFactoryChain } from "./node/AbstractNodeFactoryChain";
import { NamespaceNodeFactory } from "./node/namespace/NamespaceNodeFactory";
import { ResourceFeatureFactory } from "./node/resource/ResourceFeatureFactory";
import { ResourceNodeFactory } from "./node/resource/ResourceNodeFactory";
import { SearchableResourceFeatureFactory } from "./node/resource/search/SearchableResourceFeatureFactory";
import { SchemaFeatureFactory } from "./node/schema/SchemaFeatureFactory";

/**
 * @description _GESTAE_METADATA contains all the meta-data set by decorators in Gestate.
 *              Prefer this over experimental reflect metatdata.
 */
const _GESTAE_METADATA: Record<string, any> = {};

/**
 * @description Gets the metadata for Gestae.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getGestaeMetadata = (): Record<string, any> => {
    return _GESTAE_METADATA;
}

/**
 * @description GestaeClassType is a type that represents a class constructor.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type GestaeClassType<T = {}> = new (...args: any[]) => T;

export type GestaeObjectType = {[key: symbol | string]: any};

/**
 * @description IOptions is an interface that represents the options for a node, event, or decorator.
 *              This interface is inherently generic due to the inclusion of "[key: string]: any;".
 *              This is to accomdate well-known options for the system while minimining regrerssion
 *              caused by minor feature changes.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IOptions {
    name?:         string;
    $overloads?:   boolean;
    $extends?:     string;
    $type?:        string;
    [key: string]: any;
}

/**
 * @description Gets a reference from _GESTAE_METADATA by a string.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getTarget = (key: string): Record<string, any> | undefined => {
    return _GESTAE_METADATA[key];
}

/**
 * @description Gets a reference from _GESTAE_METADATA by a Class name.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getClassTarget = (key: GestaeClassType<any>): Record<string, any> | undefined => {
    return _GESTAE_METADATA[key.name];
}

/**
 * @description Gets a reference from _GESTAE_METADATA by a Class name of an object.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getObjectTarget = <T extends Object>(key: T): Record<string, any> | undefined => {
    return _GESTAE_METADATA[key.constructor.name];
}

/**
 * @description Sets a reference to _GESTAE_METADATA by a string.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setTarget = (key: string, target: Record<string, any>): void => {
    _GESTAE_METADATA[key] = target;
}

/**
 * @description Sets a reference to _GESTAE_METADATA by a Class name.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setClassTarget = (key: GestaeClassType<any>, target: Record<string, any>): void => {
    target.$name = key.name;
    const _super = Object.getPrototypeOf(key);
    if(_super?.name && _super !== Object) target.$extends = _super.name;
    setTarget(key.name, target);
}

/**
 * @description Sets a reference to _GESTAE_METADATA by a Class name of an object.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setObjectTarget = <T extends Object>(key: T, target: Record<string, any>): void => {
    setClassTarget(key.constructor as GestaeClassType, target);
}

/**
 * @description Gets a reference from _GESTAE_METADATA by a string and if it doesnt exist, inserts it.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getsertTarget = (target: string): Record<string, any> => {
    let _target = getTarget(target);
    if(!_target) {
        _target = {};
        setTarget(target, _target);
    }
    return _target;
}

/**
 * @description Gets a reference from _GESTAE_METADATA by a Class name and if it doesnt exist, inserts it.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getsertClassTarget = (target: GestaeClassType<any>): Record<string, any> => {
    let _target = getClassTarget(target);
    if(!_target) {
        _target = {};
        setClassTarget(target, _target);
    }
    return _target;
} 

/**
 * @description Determins if there is metadata present for a reference.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const hasMetadata = (target: string, key: string): boolean => {
    const _target = getTarget(target);
    return (!_target)? false : _target.hasOwnProperty(key);
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const hasClassMetadata = (target: GestaeClassType<any>, key: string): boolean => {
    return hasMetadata(target.name, key);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const hasObjectMetadata = <T extends Object>(target: T, key: string): boolean => {
    return hasClassMetadata(target.constructor as GestaeClassType, key);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getMetadata = (target: string, key: string, 
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
export const getClassMetadata = (target: GestaeClassType<any>, key: string, 
                                defaultValue: Record<string, any> | undefined = undefined): Record<string, any> | undefined => {
    return getMetadata(target.name, key, defaultValue);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getObjectMetadata = <T extends Object>(target: T, key: string, 
                                                    defaultValue: Record<string, any> | undefined = undefined): Record<string, any> | undefined => {
    return getClassMetadata(target.constructor as GestaeClassType, key, defaultValue);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getsertMetadata = (target: string, key: string, 
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
export const getsertClassMetadata = (target: GestaeClassType<any>, key: string, 
                                     defaultValue: Record<string, any> = {}): Record<string, any> => {
    let _targey = getsertClassTarget(target); // update getsertTarget
    let _metadata = _targey[key];
    if(!_metadata) {
        _metadata = defaultValue;
        _targey[key] = _metadata;
    }
    return _metadata;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const getsertObjectMetadata = <T extends Object>(target: T, key: string, 
                                    defaultValue: Record<string, any> = {}): Record<string, any> => {
    return getsertClassMetadata(target.constructor as GestaeClassType, key, defaultValue);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setMetadata = (target: string, key: string, data: Record<string, any>): void => {
    const _target = getsertTarget(target);
    _target[key] = data;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setClassMetadata = (target: GestaeClassType<any>, key: string, data: Record<string, any>): void => {
    setMetadata(target.name, key, data);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const setObjectMetadata = <T extends Object>(target: T, key: string, data: Record<string, any>): void => {
    setClassMetadata(target.constructor as GestaeClassType, key, data);
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteTarget = (target: string): void => {
    delete _GESTAE_METADATA[target];
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteClassTarget = (target: GestaeClassType<any>): void => {
    deleteTarget(target.name);
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteObjectTarget = <T extends Object>(target: T): void => {
    deleteTarget(target.constructor.name);
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteMetadata = (target: string, key: string): void => {
    const _target = getTarget(target);
    if(_target) delete _target[key];
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteClassMetadata = (target: GestaeClassType<any>, key: string): void => {
    deleteMetadata(target.name, key);
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const deleteObjectMetadata = <T extends Object>(target: T, key: string): void => {
    deleteClassMetadata(target.constructor as GestaeClassType, key);
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

export const defaultNodeChainFactory = ((context: IApplicationContext): AbstractNodeFactoryChain<any, any> => 
                                         new NamespaceNodeFactory(context, 
                                             new ResourceNodeFactory(context)));

export const defaultFeatureChainFactory = ((context: IApplicationContext): AbstractFeatureFactoryChain<any> => 
                                        new EventFeatureFactory(context,  
                                            new SchemaFeatureFactory(context, 
                                                new SearchableResourceFeatureFactory(context, 
                                                    new ResourceFeatureFactory(context)))))