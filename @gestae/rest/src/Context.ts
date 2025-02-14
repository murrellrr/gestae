import { GestaeError } from "./GestaeError";

export interface IContext {
    getValue(key: string, defaultValue?: any): any;
    getInstance<T>(_Class: new (...args: any[]) => T, defaultValue?: T): T;
    setValue(key: string, value: any): void;
    setInstance<T>(_Class: new (...args: any[]) => T, value: T): void;
    contains(key: string): boolean;
    remove(key: string): void;
    readonly values: any[];
    readonly keys: string[];
    readonly entries: [string, any][];
}

export class Context {
    private readonly _values: Record<string, any> = {};

    getValue(key:string, defaultValue?: any): any {
        return this._values[key] ?? defaultValue;
    }

    getInstance<T>(_Class: new (...args: any[]) => T, defaultValue?: T): T {
        const _value = this.getValue(_Class.name, defaultValue);
        if(!(_value instanceof _Class)) 
            throw new GestaeError(`Property ${_value.constructor.name} is not an instance of ${_Class.name}`);
        return _value;
    }

    setValue(key: string, value: any): void {
        this._values[key] = value;
    }

    setInstance<T>(_Class: new (...args: any[]) => T, value: T): void {
        if(!(value instanceof _Class))
            throw new GestaeError(`Parameter 'value' is not an instance of ${_Class.name}`);
        this.setValue(_Class.name, value);
    }

    contains(key: string): boolean {
        return this._values.hasOwnProperty(key);
    }

    remove(key: string): void {
        delete this._values[key];
    }

    get values(): any[] {
        return Object.values(this._values);
    }

    get keys(): string[] {
        return Object.keys(this._values);
    }   

    get entries(): [string, any][] {
        return Object.entries(this._values);
    }
}