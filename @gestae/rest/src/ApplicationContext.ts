
import { ILogger } from "./Logger";
import { IProperties } from "./Properties";

export interface IApplicationContext{
    getValue(key:string, defaultValue?: any): any;
    getInstance<T>(cls: new (...args: any[]) => T, defaultValue?: T): T;
    setValue(key:string, value:any): void;
    setInstance<T>(cls: new (...args: any[]) => T, value: T): void;
    getLogger(): ILogger;
    getProperties(): IProperties;
}

export class DefaultApplicationContext implements IApplicationContext {
    constructor(private readonly context: Map<string, any> = new Map()) {}

    getValue(key: string, defaultValue?: any): any {
        let _value = this.context.get(key);
        if(!_value) _value = defaultValue;
        return _value;
    }

    getInstance<T>(_Class: new (...args: any[]) => T, defaultValue?: T): T {
        let _property = this.getValue(_Class.name, defaultValue);
        if(!(_property instanceof _Class)) throw new Error(`Property ${_property.constructor.name} is not an instance of ${_Class.name}`);
        return _property;
    }

    setValue(key: string, value: any): void {
        this.context.set(key, value);
    }

    setInstance<T>(_Class: new (...args: any[]) => T, value: T): void{
        this.setValue(_Class.name, value);
    }

    getLogger(): ILogger {
        return {} as ILogger;
    }

    getProperties(): IProperties {
        return {} as IProperties;
    }
}

export function createApplicationContext() {
    return new DefaultApplicationContext();
}