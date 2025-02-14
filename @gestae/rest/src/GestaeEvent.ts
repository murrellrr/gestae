import { IApplicationContext } from "./ApplicationContext";
import { GestaeError } from "./GestaeError";
import { IHttpContext } from "./HttpContext";

export interface EventRegister {
  operation: string;
  event: string;
};

export class GestaeEvent<T = any> {
    private readonly _appContext: IApplicationContext;
    private _cause: GestaeError | undefined;
    private _data: T = undefined as unknown as T;
    private _canceled: boolean = false;

    public path: string;

    constructor(appContext: IApplicationContext, path: string = "gestaejs",
                data: T = undefined as unknown as T) {
        this.path = path;
        this._appContext = appContext;
        this._data = data;
    }

    get appContext(): IApplicationContext {
        return this._appContext;
    }

    get data(): T { 
        return this._data;
    }

    set data(value: T) {
        this._data = value;
    }

    cancel(cause?: any) {
        this._cause = cause;
        this._canceled = true;
    }

    get cause() {
        return this._cause;
    }

    get cancled(): boolean {
        return this._canceled;
    }

    public static create<T>(appContext: IApplicationContext, path: string = "gestaejs", 
                            data: T = undefined as unknown as T): GestaeEvent<T> {
        return new GestaeEvent(appContext, path, data);
    }

    public static createEventURI(path: string, register: EventRegister): string {
        return `${path}.${register.operation}.${register.event}`;
    }
}

export class GestaeHttpEvent<T = any> extends GestaeEvent<T> {
    private readonly _httpContext: IHttpContext;

    constructor(appContext: IApplicationContext, httpContext: IHttpContext, path: string = "gestaejs", 
                data: T = undefined as unknown as T) {
        super(appContext, path, data);
        this._httpContext = httpContext;
    }

    get httpContext(): IHttpContext {
        return this._httpContext;
    }

    public static createHttpEvent<T>(path: string, httpContext: IHttpContext, 
                                     data: T = undefined as unknown as T): GestaeEvent<T> {
        return new GestaeHttpEvent(httpContext.applicationContext, httpContext, path, data);
    }

    public static createHttpEventNoPath<T>(httpContext: IHttpContext, 
        data: T = undefined as unknown as T): GestaeEvent<T> {
        return new GestaeHttpEvent(httpContext.applicationContext, httpContext, "gestaejs", data);
    }
}

function registerEvent(target: any, method: string, register: EventRegister, once: boolean = false) {
  if(!target.constructor.__events) target.constructor.__events = [];
  target.constructor.__events.push({ register: register, method: method, once: once });
}

export function OnEvent(register: EventRegister) {
  return function (target: any, property: string, descriptor: PropertyDescriptor) {
    registerEvent(target, property, register, false);
  };
}

export function OnEventOnce(register: EventRegister) {
  return function (target: any, property: string, descriptor: PropertyDescriptor) {
    registerEvent(target, property, register, true);
  };
}