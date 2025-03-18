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

import { Node } from "yallist";
import { IResourceNode } from "../IResourceNode";
import { IResourceItem, ResourceResolverType } from "./IResourceItem";
import { IResourceReader } from "./IResourceReader";
import { GestaeObjectType } from "../../../Gestae";

export class ResourceItem<T extends GestaeObjectType> implements IResourceItem<T> {
    public           node?:      Node<IResourceItem<T>>;
    public           resources:  IResourceReader;
    public  readonly key:        string;
    public  readonly name:       string;
    private          _value:     {} | ResourceResolverType;

    constructor(key: IResourceNode, resources: IResourceReader, 
                value: {} | ResourceResolverType) {
        this.key       = key.fullyQualifiedPath;
        this.name      = key.name;
        this._value    = value;
        this.resources = resources;
    }

    get next(): IResourceItem<T> | undefined {
        if(this.node?.next)
            this.node = this.node.next;
        return this.node?.value;
    }

    get previous(): IResourceItem<T> | undefined {
        if(this.node?.prev)
            this.node = this.node.prev;
        return this.node?.value;
    }

    async getValue<T extends GestaeObjectType>(options: Record<string, any> = {}): Promise<T> {
        if(this._value instanceof Function)
            this._value = await this._value<T>(options);
        return this._value as T;
    }

    setValue<T extends GestaeObjectType>(value: T | ResourceResolverType): void {
        this._value = value;
    }
}