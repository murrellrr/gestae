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
    Yallist, 
    Node 
} from "yallist";
import { NotFoundError } from "../../../error/NotFoundError";
import { IHttpContext } from "../../../http/IHttpContext";
import { IResourceItem, ResourceResolverType } from "./IResourceItem";
import { IResourceReader } from "./IResourceReader";
import { IResourceWriter } from "./IResourceWriter";
import { ResourceItem } from "./ResourceItem";
import { IResourceNode } from "../IResourceNode";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceManager implements IResourceReader, IResourceWriter {
    protected readonly context:          IHttpContext
    private   readonly _resources:       Yallist<ResourceItem> = Yallist.create();
    private            _currentResource: Node<ResourceItem> | undefined = this._resources.head;

    constructor(context: IHttpContext) {
        this.context = context;
    }

    contains(key: IResourceNode): boolean {
        for(const _resource of this._resources) {
            if(_resource.key === key.fullyQualifiedPath) return true;
        }
        return false;
    }

    get current(): IResourceItem<any> | undefined {
        return this._currentResource?.value as IResourceItem<any>;
    }

    get<T extends {}>(key: IResourceNode): IResourceItem<T> {
        for(const _resource of this._resources) {
            if(_resource.key === key.fullyQualifiedPath) return _resource;
        }
        throw new NotFoundError(key.fullyQualifiedPath);
    }

    async getValue<T extends {}>(key: IResourceNode, options?: Record<string, any>): Promise<T> {
        let _resource = this.get<T>(key);
        return _resource.getValue(options);
    }

    protected _get(key: IResourceNode): ResourceItem | undefined {
        for(const _resource of this._resources) {
            if(_resource.key === key.fullyQualifiedPath) return _resource;
        }
        return undefined;
    }

    set<T extends {}>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T> {
        this.context.log.debug(`ResourceManager:set(): Enter ${key.fullyQualifiedPath}`);
        const _resource = new ResourceItem(key, this, value);
        this._resources.push(_resource);
        this._currentResource = this._resources.tail;
        _resource.node = this._resources.tail;
        return _resource;
    }

    setValue<T extends {}>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T> {
        this.context.log.debug(`ResourceManager:setValue(): Enter ${key.fullyQualifiedPath}`);
        let _resource: IResourceItem<any> | ResourceItem | undefined = this._get(key);
        this.context.log.debug(`ResourceManager:setValue(): Resource ${_resource?.key}`);
        if(!_resource) {
            this.context.log.debug(`ResourceManager:setValue(): Resource not found, creating new resource.`);
            _resource = this.set<T>(key, value);
        }
        else {
            this.context.log.debug(`ResourceManager:setValue(): Resource not found, creating new resource.`);
            _resource.setValue<T>(value);
        }
        return _resource;
    }

    [Symbol.iterator](): IterableIterator<IResourceItem<any>> {
        return this._resources[Symbol.iterator]();
    }
}