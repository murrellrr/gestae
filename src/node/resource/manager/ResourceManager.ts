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

import { Yallist } from "yallist";
import { NotFoundError } from "../../../error/NotFoundError";
import { IHttpContext } from "../../../http/IHttpContext";
import { 
    IResourceItem, 
    ResourceResolverType 
} from "./IResourceItem";
import { IResourceReader } from "./IResourceReader";
import { IResourceWriter } from "./IResourceWriter";
import { ResourceItem } from "./ResourceItem";
import { IResourceNode } from "../IResourceNode";
import { 
    GestaeClassType, 
    GestaeObjectType 
} from "../../../Gestae";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceManager implements IResourceReader, IResourceWriter {
    protected readonly context:          IHttpContext
    private   readonly _resources:       Yallist<ResourceItem<any>> = Yallist.create();
    private            _currentResource: ResourceItem<any> | undefined;

    constructor(context: IHttpContext) {
        this.context = context;
    }

    contains(key: IResourceNode): boolean {
        for(const _resource of this._resources) {
            if(_resource.key === key.fullyQualifiedPath) return true;
        }
        return false;
    }

    get hasCurrent() : boolean {
        return this._currentResource !== undefined;
    }

    get current(): IResourceItem<any> | undefined {
        return this._currentResource;
    }

    get<T extends GestaeObjectType>(key: IResourceNode): IResourceItem<T> {
        for(const _resource of this._resources) {
            if(_resource.key === key.fullyQualifiedPath) return _resource;
        }
        throw new NotFoundError(key.fullyQualifiedPath);
    }

    getByName<T extends GestaeObjectType>(name: GestaeClassType | string): IResourceItem<T> {
        const _name = typeof name === "string" ? name : name.name.toLowerCase();
        for(const _resource of this._resources) {
            if(_resource.name === _name) return _resource;
        }
        throw new NotFoundError(_name);
    };

    getByPath<T extends GestaeObjectType>(path: string): IResourceItem<T> {
        for(const _resource of this._resources) {
            if(_resource.key === path) return _resource;
        }
        throw new NotFoundError(path);
    }

    async getValue<T extends GestaeObjectType>(key: IResourceNode, options?: Record<string, any>): Promise<T> {
        const _resource = this.get<T>(key);
        return _resource.getValue(options);
    }

    async getValueByName<T extends GestaeObjectType>(name: GestaeClassType | string, options?: Record<string, any>): Promise<T> {
        const _resource = this.getByName<T>(name);
        return _resource.getValue(options);
    }

    async getValueByPath<T extends GestaeObjectType>(path: string, options?: Record<string, any>): Promise<T> {
        const _resource = this.getByPath<T>(path);
        return _resource.getValue(options);
    }

    protected _get<T extends GestaeObjectType>(key: IResourceNode): ResourceItem<T> | undefined {
        for(const _resource of this._resources) {
            if(_resource.key === key.fullyQualifiedPath) return _resource;
        }
        return undefined;
    }

    protected _set<T extends GestaeObjectType>(key: IResourceNode, value: T | ResourceResolverType): ResourceItem<T> {
        const _resource       = new ResourceItem<T>(key, this, value);
        this._resources.push(_resource);
        _resource.node        = this._resources.tail;
        return _resource;
    }

    set<T extends GestaeObjectType>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T> {
        return this._set<T>(key, value);
    }

    setCurrent<T extends GestaeObjectType>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T> {
        const _resource = this._set<T>(key, value);
        this._currentResource = _resource;
        return _resource;
    }

    setValue<T extends GestaeObjectType>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T> {
        let _resource: ResourceItem<T> | undefined = this._get(key);
        if(!_resource)
            _resource = this._set<T>(key, value);
        else
            _resource.setValue(value);
        return _resource;
    }

    setCurrentValue<T extends GestaeObjectType>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T> {
        let _resource: ResourceItem<T> | undefined = this._get(key);
        if(!_resource)
            _resource = this._set<T>(key, value);
        else
            _resource.setValue(value);
        this._currentResource = _resource;
        return _resource;
    }

    [Symbol.iterator](): IterableIterator<IResourceItem<any>> {
        return this._resources[Symbol.iterator]();
    }
}