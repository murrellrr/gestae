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

import { 
    ClassType,
    defineEvents,
    EventRegisterType,
    getsertMetadata,
    hasMetadata,
    IOptions,
    setMetadata
} from "./Gestae";
import { 
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { GestaeError } from "./GestaeError";
import { 
    AbstractPartFactoryChain, 
    FactoryReturnType 
} from "./AbstractPartFactoryChain";
import { Template } from "./Template";
import { AbstractTaskablePart } from "./Task";
import _ from "lodash";

const NAMESPACE_OPTION_KEY = "gestaejs:namespace";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface INamespaceOptions extends IOptions {
    name?: string;
    instance?: Object;
    traversable?: boolean;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface INamesapce {}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const NamespaceEvents = defineEvents(
    ["traverse"],
    ["before", "on", "after", "error"]
);

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NamespaceEvent extends HttpEvent<INamesapce> {
    //
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NamespacePart extends AbstractTaskablePart<INamespaceOptions> implements INamesapce {
    constructor(public readonly instance: Object, options: INamespaceOptions = {}) {
        super(options);
        options.name = options.name ?? this.constructor.name.toLowerCase();
        options.traversable = options.traversable ?? true;
        options.$overloads = options.$overloads ?? true;
    }

    get type(): string {
        return "namespace";
    }

    getInstance<T extends Object>(): T {
        return this.instance as T;
    }

    public static create(aClass: ClassType | string, options: INamespaceOptions = {}): NamespacePart {
        if(typeof aClass === "string") {
            const _result = NamespacePartFactory.createFromString(aClass);
            return _result.bottom ?? _result.top;
        }
        else {
            const _instance = new aClass([]);
            return new NamespacePart(_instance, getsertMetadata(_instance, NAMESPACE_OPTION_KEY, options));
        }
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
class DefaultNameSpace {
    static getInstance(): Object {
        return new DefaultNameSpace();
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NamespacePartFactory extends AbstractPartFactoryChain<INamespaceOptions, NamespacePart> {
    isPartFactory(target: Template): boolean {
        return target.isString || 
               (target.isClass && hasMetadata(target.base, NAMESPACE_OPTION_KEY));
    }

    _create(target: Template): FactoryReturnType<INamespaceOptions, NamespacePart> {
        this.log.debug(`Creating namespace '${target.name}'`);
        if(target.isString)
            return NamespacePartFactory.createFromString((target.base as string));
        else 
            return { top: NamespacePart.create((target.base as ClassType)) };
    }

    public static createFromDelimString(target: string, options: INamespaceOptions = {}): FactoryReturnType<INamespaceOptions, NamespacePart> {
        const _parts = target.split("/").filter(p => p.length > 0);

        let _parent: NamespacePart | undefined;
        let _current: NamespacePart | undefined;
        let _first: NamespacePart | undefined;
        for(const _part of _parts) {
            let _options = _.cloneDeep(options);
            _options.name = _part.trim().toLowerCase();
            _current = new NamespacePart(DefaultNameSpace.getInstance(), _options);
            if(!_first) _first = _current;
            if(_parent) _parent.add(_current);
            _parent = _current;
        }
        return { top: _first!, bottom: _current };
    }

    public static createFromString(target: string, options: INamespaceOptions = {}): FactoryReturnType<INamespaceOptions, NamespacePart> {
        target = target.trim();
        if(target.length === 0)
            throw GestaeError.toError("Namespace name cannot be empty.");
        return NamespacePartFactory.createFromDelimString(target, options);
    }
}

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function Namespace(options: INamespaceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name        = options.name ?? target.name.toLowerCase();
        options.instance    = new target([]);
        options.traversable = options.traversable ?? true;
        options.$overloads  = options.$overloads ?? true;
        setMetadata(target, NAMESPACE_OPTION_KEY, options);
    };
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnNamespaceEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: NamespaceEvent) => void>) {
        setEventConfig(target, event, property, options);
    };
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnAsyncNamespaceEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: NamespaceEvent) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}