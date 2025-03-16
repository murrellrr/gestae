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

import { Yallist, Node } from "yallist/dist/commonjs";
import { IResourceNode } from "./Resource";
import { GestaeClassType, GestaeObjectType } from "./Gestae";
import { NotFoundError } from "./GestaeError";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type ResourceResolverType = <T = {}>(options?: Record<string, any>) => Promise<T>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResource<T = {}> {
    get name(): string;
    get key(): string;
    get resources(): IResourceReader;
    get next(): IResource<T> | undefined;
    get previous(): IResource<T> | undefined;
    getValue<T extends {}>(options?: Record<string, any>): Promise<T>;
    setValue<T extends {}>(value: T | ResourceResolverType): void;
};


class Resource implements IResource<any> {
    public           node?:      Node<IResource<any>>;
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

    get next(): IResource<any> | undefined {
        if(this.node?.next)
            this.node = this.node.next;
        return this.node?.value;
    }

    get previous(): IResource<any> | undefined {
        if(this.node?.prev)
            this.node = this.node.prev;
        return this.node?.value;
    }

    async getValue<T = {}>(options: Record<string, any> = {}): Promise<T> {
        if(this._value instanceof Function)
            this._value = await this._value<T>(options);
        return this._value as T;
    }

    setValue<T extends {}>(value: T | ResourceResolverType): void {
        this._value = value;
    }
}

export type ResourceKeyType = string | GestaeClassType | IResourceNode | IResource<any>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceReader {
    contains(key: IResourceNode): boolean;
    get current(): IResource<any> | undefined;
    get<T extends {}>(key: ResourceKeyType): IResource<T>;
    getValue<T extends {}>(key: ResourceKeyType, options?: Record<string, any>): Promise<T>
    [Symbol.iterator](): IterableIterator<IResource<any>>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceWriter {
    set(key: IResourceNode, value: GestaeObjectType | ResourceResolverType): IResource<any>;
    setValue(key: IResourceNode, value: GestaeObjectType | ResourceResolverType): IResource<any>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceManager implements IResourceReader, IResourceWriter {
    private readonly _resources:       Yallist<Resource> = Yallist.create();
    private          _currentResource: Node<Resource> | undefined = this._resources.head;

    private _getKeyValue(key: ResourceKeyType): string {
        let _key: string;
        if(typeof key === "string")
            _key = key;
        else if(typeof key === "function")
            _key = key.name;
        else 
            _key = (key as IResourceNode).resourceKey || (key as IResource<any>).key;
        return _key;
    }

    contains(key: ResourceKeyType): boolean {
        let _key = this._getKeyValue(key);
        for(const _resource of this._resources) {
            if(_resource.key === _key) return true;
        }
        return false;
    }

    get current(): IResource<any> | undefined {
        return this._currentResource?.value as IResource<any>;
    }

    get<T extends {}>(key: ResourceKeyType): IResource<T> {
        let _key = this._getKeyValue(key);
        for(const _resource of this._resources) {
            if(_resource.key === _key) return _resource;
        }
        throw new NotFoundError(_key);
    }

    async getValue<T extends {}>(key: ResourceKeyType, options?: Record<string, any>): Promise<T> {
        let _resource = this.get<T>(key);
        return _resource.getValue(options);
    }

    protected _get(key: IResourceNode): Resource | undefined {
        for(const _resource of this._resources) {
            if(_resource.key === key.resourceKey) return _resource;
        }
        return undefined;
    }

    set<T extends {}>(key: IResourceNode, value: T | ResourceResolverType): IResource<T> {
        const _resource = new Resource(key, this, value);
        this._resources.push(_resource);
        this._currentResource = this._resources.tail;
        _resource.node = this._resources.tail;
        return _resource;
    }

    setValue<T extends {}>(key: IResourceNode, value: T | ResourceResolverType): IResource<T> {
        let _resource: IResource<any> | Resource | undefined = this._get(key);
        if(!_resource)
            _resource = this.set<T>(key, value);
        else 
            _resource.setValue<T>(value);
        return _resource;
    }

    [Symbol.iterator](): IterableIterator<IResource<any>> {
        return this._resources[Symbol.iterator]();
    }
}