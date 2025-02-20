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

import "reflect-metadata";
import { IHttpContext } from "./HttpContext";
import { IApplicationContext } from "./ApplicationContext";
import { 
    IEventRegister, 
    setEventMetaData, 
    validateAndSetTypedEventMetaData 
} from "./Gestae";

export class GestaeEvent<T> {
    private _cancled: boolean = false;
    private _casue: any = null;
    public data: T;
    public path: string = "gestaejs";

    constructor(data: T) {
        this.data = data;
    }

    cancel(cause?: any): void {
        this._cancled = true;
        this._casue = cause;
    }

    get cancled(): boolean {
        return this._cancled;
    }

    get cause(): any {
        return this._casue;
    }   
}

export class ApplicationEvent<T> extends GestaeEvent<T> {
    public readonly context: IApplicationContext;

    constructor(context: IApplicationContext, data: T, ) {
        super(data);
        this.context = context;
    }
}

export class HttpEvent<T> extends GestaeEvent<T> {
    public readonly context: IHttpContext;

    constructor(context: IHttpContext, data: T, ) {
        super(data);
        this.context = context;
    }
}

export function OnEvent(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, descriptor: PropertyDescriptor) {
        setEventMetaData(target, event, property);
    };
}

export function OnApplicationEvent<I>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent<I>) => void>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}

export function OnAsyncApplicationEvent<I>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: ApplicationEvent<I>) => Promise<void>>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}

export function OnHttpEvent<I>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<I>) => void>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}

export function OnAsyncHttpEvent<I>(event: IEventRegister) {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: HttpEvent<I>) => Promise<void>>) {
        validateAndSetTypedEventMetaData(target, descriptor, event, property);
    };
}