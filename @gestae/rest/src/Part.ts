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

export interface IPartOptions {
    name?: string;
    path?: string;
};

export const PartEvents = {
    Initialize: {
        OnBefore: {operation: "initialize", action: "before"},
        On: {operation: "initialize", action: "on"},
        OnAfter: {operation: "initialize", action: "after"},
        OnError: {operation: "initialize", action: "error"}
    },
    Destroy: {
        OnBefore: {operation: "destroy", action: "before"},
        On: {operation: "destroy", action: "on"},
        OnAfter: {operation: "destroy", action: "after"},
        OnError: {operation: "destroy", action: "error"}
    },
}

export interface IPart {
    get name(): string;
    get parent(): AbstractPart | undefined;
    getRoot(): AbstractPart;
    getChild(name: string): AbstractPart | undefined;
    getChildByPath(path: string): AbstractPart | undefined;
    addChild(part: AbstractPart): AbstractPart;
}

export abstract class AbstractPart implements IPart {
    protected readonly children: Record<string, AbstractPart> = {};
    protected _parent: AbstractPart | undefined;
    protected readonly options: IPartOptions = {};

    constructor(options: IPartOptions = {}) {
        this.options.name = options?.name ?? new.target.name;
    }

    get name(): string {
        return this.options.name!; // Set in the constructor
    }

    get parent(): AbstractPart | undefined {
        return this._parent;
    }

    getRoot(): AbstractPart {
        let _part: AbstractPart = this;
        while(_part.parent) {
            _part = _part.parent;
        }
        return _part;
    }

    getChild(name: string): AbstractPart | undefined {
        return this.children[name];
    }

    getChildByPath(path: string): AbstractPart | undefined {
        const _tokens = path.split("/").filter(token => token.trim() !== "");
        let _part: AbstractPart | undefined = this;

        for(const _token of _tokens) {
            if(!_part) return undefined;
            _part = _part.getChild(_token);
        }

        return _part;
    }

    addChild(part: AbstractPart): AbstractPart {
        if(this.children[part.name]) 
            throw new GestaeError(`Part with name '${part.name}' already exists.`);
        this.children[part.name] = part;
        part._parent = this;
        return part;
    }

    async initialize(): Promise<void> {
        //
    }

    async destroy(): Promise<void> {
        //
    }

    abstract _doRequest(): Promise<void>;

    async doRequest(): Promise<void> {
        //
    }
}