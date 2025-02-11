import { IRequestContext } from "./RequestContext";

export class GestaeEvent<T = any> {
    constructor(public name: string, public data: T = undefined as unknown as T) {}
}

export class CancelableEvent<T = any> extends GestaeEvent<T> {
    private _canceled: boolean = false;

    cancel() {
        this._canceled = true;
    }

    get cancled(): boolean {
        return this._canceled;
    }
}

export abstract class HttpRequestEvent<T> extends CancelableEvent<T> {
    constructor(name: string, public readonly request: IRequestContext, data?: T) {
        super(name, data);
    }
}

function registerEvent(target: any, method: string, name: string, once: boolean = false) {
    if(!target.constructor.__events)
        target.constructor.__events = [];
    target.constructor.__events.push({name, method, once});
}

export function OnEvent(name: string) {
    return function (target: any, property: string, descriptor: PropertyDescriptor) {
        registerEvent(target, property, name, false);
    };
}

export function OnEventOnce(name: string) {
    return function (target: any, property: string, descriptor: PropertyDescriptor) {
        registerEvent(target, property, name, true);
    };
}