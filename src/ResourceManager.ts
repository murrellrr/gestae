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

import { ClassType } from "./Gestae";

export interface IResourceManager {
    contains(key: ClassType | string): boolean;
    getResource<T extends Object>(resource: ClassType | string, defaultValue?: T | undefined): T;
    setResource<T extends Object>(resource: ClassType | string, value: T): T;
    get resources(): MapIterator<Object>;
}

export class ResourceManager {
    private readonly _resources:          Map<string, Object> = new Map<string, Object>();

    contains(key: ClassType | string): boolean {
        return this._resources.has((typeof key === "string")? key : key.name);
    }

    getResource<T extends Object>(key: ClassType | string, defaultValue?: T | undefined): T {
        let _resource = this._resources.get((typeof key === "string")? key : key.name);
        if(!_resource) _resource = defaultValue;
        return _resource as T;
    }

    setResource<T extends Object>(key: ClassType | string, value: T): T {
        this._resources.set((typeof key === "string")? key : key.name, value);
        return value;
    }

    get resources(): MapIterator<Object> {
        return this._resources.values();
    }
}