import { IApplicationContext } from "./ApplicationContext";
import http from 'http';
import { GestaeError } from "./GestaeError";

/**
 * 
 */
export class URI {
    private readonly _parts: string[];
    private _part: string;
    private _index: number = 0;

    constructor(uri: string) {
        // Split the URI by '/', filter out empty strings to handle leading/trailing/multiple slashes
        this._parts = uri.split("/").filter(part => part.length > 0);
        this._index = 0;
        this._part = this._parts[this._index];
    }

    get part(): string {
        return this._part;
    }

    next(): string {
        if(this._index < this._parts.length) {
            this._part = this._parts[++this._index];
            return this._part;
        }
        else
            throw new GestaeError("End of Path"); // No more parts to return
    }

    peek(response: {peek: string}): boolean | undefined {
        const _peekIndex = this._index + 1;
        if(this._index < this._parts.length) {
            response.peek = this._parts[_peekIndex];
            return true;
        }
        else
            return false; // No more parts to return
    }

    reset(): void {
        this._index = 0;
    }

    hasNext(): boolean {
        return this._index < this._parts.length;
    }
}

export interface IRequestContext {
    get applicationContext(): IApplicationContext;
    get request(): IHttpRequest;
}

export interface IHttpRequest {
    get url(): URL;
    get uri(): URI;
    get http(): http.IncomingMessage;
    get query(): Map<string, string>;
    getQuery(key: string): string | undefined;
    get params(): Map<string, string>;
    getParam(key: string): string | undefined;
}

export class HttpRequest implements IHttpRequest{
    public readonly url: URL;
    public readonly uri: URI;
    public readonly query: Map<string, string> = new Map();
    public readonly params: Map<string, string> = new Map();

    constructor(private readonly _request: http.IncomingMessage) {
        this.url = new URL(_request.url || "", `http://${_request.headers.host}`);
        this.uri = new URI(this.url.pathname);
        this.url.searchParams.forEach((value, key) => {
            this.query.set(key, value);
        });
        //
    }

    get http(): http.IncomingMessage {
        return this._request;
    }

    get method(): string {
        return this._request.method?.toLowerCase() ?? "get";
    }

    getQuery(key: string): string | undefined {
        return this.query.get(key);
    }

    getParam(key: string): string | undefined {
        return this.params.get(key);
    }
}

export class DefaultRequestContext implements IRequestContext {
    private _request: HttpRequest;

    constructor(private readonly _applicationContext: IApplicationContext, request: http.IncomingMessage) {
        this._request = new HttpRequest(request);
    }

    get applicationContext(): IApplicationContext { // Supports the Interface
        return this.applicationContext;
    }

    get request(): IHttpRequest {
        return this._request as IHttpRequest;
    }
}

export function createRequestContextFactory(context: IApplicationContext, request: http.IncomingMessage): IRequestContext {
    return new DefaultRequestContext(context, request);
}