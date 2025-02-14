
import { AsyncEventEmitter, IAsyncEventEmitter } from "./AsyncEventEmitter";
import { Context, IContext } from "./Context";
import { ILogger } from "./Logger";
import { IProperties } from "./Properties";

export interface IApplicationContext extends IContext {
    get logger(): ILogger;
    get properties(): IProperties;
    get events(): IAsyncEventEmitter;
}

export class DefaultApplicationContext extends Context implements IApplicationContext {
    private readonly _logger: ILogger;
    private readonly _properties: IProperties;
    private readonly _events: IAsyncEventEmitter;

    constructor(rootLogger: ILogger, properties: IProperties) {
        super();
        this._logger = rootLogger;
        this._properties = properties;
        this._events = new AsyncEventEmitter(this._logger); 
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