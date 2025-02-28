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

import { AbstractPartFactoryChain, FactoryReturnType } from "./AbstractPartFactoryChain";
import { IApplicationContext } from "./ApplicationContext";
import { 
    ClassType,
    defineEvents,
    EventRegisterType,
    getClassOptions,
    hasOptionData, 
    isClassConstructor, 
    setClassOptions 
} from "./Gestae";
import { 
    HttpEvent, 
    IEventOptions, 
    setEventConfig 
} from "./GestaeEvent";
import { AbstractPart } from "./Part";
import { GestaeError } from "./GestaeError";
import _ from "lodash";

const NAMESPACE_OPTION_KEY = "gestaejs:namespace";

export interface INamespaceOptions {
    name?: string;
    traversable?: boolean;
}

export interface INamesapce {}

export const NamespaceEvents = defineEvents(
    ["traverse"],
    ["before", "on", "after", "error"]
);

export class NamespaceEvent extends HttpEvent<INamesapce> {
    //
}

export class NamespacePart extends AbstractPart<INamespaceOptions> implements INamesapce {
    
    constructor(target: new (...args: any[]) => any, context: IApplicationContext, options: INamespaceOptions = {}) {
        super(target, context, options);
        options.name = options.name ?? target.name.toLowerCase();
        options.traversable = options.traversable ?? true;
    }

    async _initialize(): Promise<void> {
        //
    }

    async _finalize(): Promise<void> {
        //
    }
}

@Namespace()
export class DefaultNamespace {
    // Do nothing.
}

export class NamespacePartFactory extends AbstractPartFactoryChain<INamespaceOptions, NamespacePart> {
    isPartFactory(target: ClassType | string): boolean {
        return (typeof target === "string") || 
               (isClassConstructor(target) && hasOptionData(target, NAMESPACE_OPTION_KEY));
    }

    _create(part: ClassType | string): FactoryReturnType<INamespaceOptions, NamespacePart> {
        this.log.debug(`Creating namespace '${part}'`);
        if(typeof part === "string")
            return this._createFromString(part);
        else
            return { top: new NamespacePart(part, this.context, getClassOptions(part, NAMESPACE_OPTION_KEY)) };
    }

    private _createFromString(part: string, options: INamespaceOptions = {}): FactoryReturnType<INamespaceOptions, NamespacePart> {
        part = part.trim();
        if(part.length === 0)
            throw GestaeError.toError("Namespace name cannot be empty.");
        return this._createFromDelimString(part, options);
    }

    private _createFromDelimString(part: string, options: INamespaceOptions = {}): FactoryReturnType<INamespaceOptions, NamespacePart> {
        const _parts = part.split("/").filter(p => p.length > 0);

        let _parent: NamespacePart | undefined;
        let _current: NamespacePart | undefined;
        let _first: NamespacePart | undefined;
        for(const _part of _parts) {
            let _options = _.cloneDeep(options);
            _options.name = _part.trim().toLowerCase();
            _current = new NamespacePart(DefaultNamespace, this.context, _options);
            if(!_first) _first = _current;
            if(_parent) _parent.insert(_current);
            _parent = _current;
        }
        return { top: _first!, bottom: _current };
    }
}

/**
 * @description Decorator for configuraing a plain-old object as a resource in Gestae.
 * @param options 
 * @returns 
 */
export function Namespace(options: INamespaceOptions = {}) {
    return function (target: new (... args: [any]) => any) {
        options.name = options.name ?? target.name.toLowerCase();
        setClassOptions(target, NAMESPACE_OPTION_KEY, options);
    };
}

export function OnNamespaceEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: NamespaceEvent) => void>) {
        setEventConfig(target, event, property, options);
    };
}

export function OnAsyncNamespaceEvent(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: NamespaceEvent) => Promise<void>>) {
        setEventConfig(target, event, property, options);
    };
}