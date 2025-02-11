
import { AsyncEventEmitter, IAsyncEventEmitter } from "./AsyncEventEmitter";
import { ILogger } from "./Logger";
import { IProperties } from "./Properties";

export interface IApplicationContext{
    getValue(key:string, defaultValue?: any): any;
    getInstance<T>(cls: new (...args: any[]) => T, defaultValue?: T): T;
    setValue(key:string, value:any): void;
    setInstance<T>(cls: new (...args: any[]) => T, value: T): void;
    get logger(): ILogger;
    get properties(): IProperties;
    get events(): IAsyncEventEmitter
}

export class DefaultApplicationContext implements IApplicationContext {
    private readonly _context: Map<string, any> = new Map();
    private readonly _logger: ILogger;
    private readonly _properties: IProperties;
    private readonly _events: IAsyncEventEmitter = new AsyncEventEmitter();

    constructor(rootLogger: ILogger, properties: IProperties) {
        this._logger = rootLogger;
        this._properties = properties;
    }

    getValue(key: string, defaultValue?: any): any {
        let _value = this._context.get(key);
        if(!_value) _value = defaultValue;
        return _value;
    }

    getInstance<T>(_Class: new (...args: any[]) => T, defaultValue?: T): T {
        let _property = this.getValue(_Class.name, defaultValue);
        if(!(_property instanceof _Class)) throw new Error(`Property ${_property.constructor.name} is not an instance of ${_Class.name}`);
        return _property;
    }

    setValue(key: string, value: any): void {
        this._context.set(key, value);
    }

    setInstance<T>(_Class: new (...args: any[]) => T, value: T): void{
        this.setValue(_Class.name, value);
    }

    get logger(): ILogger {
        return this._logger;
    }

    get properties(): IProperties {
        return {} as IProperties;
    }

    get events(): IAsyncEventEmitter {
        return this._events;
    }
}

export function createApplicationContext(logger: ILogger, properties: IProperties): IApplicationContext {
    return new DefaultApplicationContext(logger, properties);
}