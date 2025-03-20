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

import { GestaeObjectType } from "../Gestae";
import { 
    EventRegisterType, 
    GestaeEvent,
    IEventOptions,
    setEventMetadata
} from "../events/GestaeEvent";
import { AbstractHttpRequestBody } from "./AbstractHttpRequestBody";
import { GestaeHeaderValue } from "./HTTP";
import { ICookie } from "./ICookie";
import { IHttpContext } from "./IHttpContext";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const HttpEvents = {
    Http: {
        OnBefore: {action: "before"} as EventRegisterType,
        OnAfter:  {action: "after" } as EventRegisterType,
    },
    Get: {
        OnBefore: {operation: "get", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "get", action: "after" } as EventRegisterType,
    },
    Post: {
        OnBefore: {operation: "post", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "post", action: "after" } as EventRegisterType,
    },
    Put: {
        OnBefore: {operation: "put", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "put", action: "after" } as EventRegisterType,
    },
    Delete: {
        OnBefore: {operation: "delete", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "delete", action: "after" } as EventRegisterType,
    },
    Patch: {
        OnBefore: {operation: "patch", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "patch", action: "after" } as EventRegisterType,
    },
    Options: {
        OnBefore: {operation: "options", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "options", action: "after" } as EventRegisterType,
    },
    Head: {
        OnBefore: {operation: "head", action: "before"} as EventRegisterType,
        OnAfter:  {operation: "head", action: "after" } as EventRegisterType,
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpEvent<T extends GestaeObjectType> extends GestaeEvent<T> {
    public readonly context : IHttpContext;

    constructor(context: IHttpContext, data: T, path?: string) {
        super(data, path);
        this.context = context;
    }

    get method(): string {
        return this.context.request.method;
    }

    async getBody<T>(content?: AbstractHttpRequestBody<T>): Promise<T> {
        return this.context.request.getBody<T>(content);
    }

    getSearchParam(key: string, defaultValue?: string): string | undefined {
        return this.context.request.searchParams.get(key, defaultValue);
    }

    getRequestHeader(key: string, defaultValue?: string): GestaeHeaderValue {
        return this.context.request.getHeader(key, defaultValue);
    }

    getCookie(key: string, defaultValue?: ICookie): ICookie | undefined {
        return this.context.request.getCookie(key, defaultValue);
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export function OnHttpEvent<E>(event: EventRegisterType, options: IEventOptions = {}) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<any>) => Promise<void>>) {
        setEventMetadata(target, event, property, options);
    };
} // Cant be constant because it is used as a decorator.