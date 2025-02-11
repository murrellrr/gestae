import { IApplicationContext, createApplicationContext } from "./ApplicationContext";
import { IRequestContext, createRequestContextFactory } from "./RequestContext"; 
import { GestaeError } from "./GestaeError";
import { Plugin } from "./Plugin";
import http from 'http';
import { INamespaceOptions, Namespace } from "./Namespace";

export const VERSION = "1.0.0";

const EventNamespace = (baseUri: string): any => {
    return new Proxy(() => baseUri, {
        get(target, prop: string) {
            return EventNamespace(`${baseUri}/${prop}`);
        },
        apply(target, _, args) {
            const version = args.length > 0 ? args[0] : VERSION;
            return EventNamespace(`gestaejs.com/${version}`);
        }
    });
};

export const GestaeEventFactory = EventNamespace("gestaejs.com").version(VERSION);

export interface IApplicationOptions extends INamespaceOptions {
    name?: string;
    port?: number;
    applicationContextFactory?: () => IApplicationContext;
    requestContextFactoryContextFactory?: (context:IApplicationContext, request: http.IncomingMessage) => IRequestContext;
};

export class Application extends Namespace {
    public readonly appOptions: IApplicationOptions;

    public readonly plugins: Map<string, Plugin> = new Map();
    private readonly _context: IApplicationContext;
    private _server: http.Server | undefined;

    constructor(options: IApplicationOptions = {}) {
        super(options?.name ?? "api", options);

        this.appOptions = options;
        this.appOptions.port = options.port ?? 3000;
        this.appOptions.applicationContextFactory = options.applicationContextFactory ?? createApplicationContext;
        this.appOptions.requestContextFactoryContextFactory = options.requestContextFactoryContextFactory ?? createRequestContextFactory;

        // Create the application context.
        this._context = this.appOptions.applicationContextFactory(); // create the context
    }

    get context(): IApplicationContext {
        return this._context;
    }

    addPlugin<T extends Plugin>(_Plugin: new (...args: any[]) => T, instance: T): this {
        if (!(instance instanceof Plugin))
            throw new GestaeError(`Instance must extend Plugin: ${_Plugin.name}`);
        this.plugins.set(_Plugin.name, instance);
        return this; // Enables daisy-chaining
    }

    getPlugin<T extends Plugin>(_Plugin: new (...args: any[]) => T): T | undefined {
        return this.plugins.get(_Plugin.name) as T | undefined;
    }

    private async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        if (!this.appOptions.requestContextFactoryContextFactory)
            throw new GestaeError("requestContextFactoryContextFactory is not defined");
        const _requestContext: IRequestContext = this.appOptions.requestContextFactoryContextFactory(this.context, req);
        await this.do(_requestContext);
    }

    private _handleError(req: http.IncomingMessage, res: http.ServerResponse, error: any): void {
        res.writeHead(error.code, error.message, {"Content-Type": "application/json"});
        res.write(JSON.stringify(error, null, 2));
    }

    async start(port?:number): Promise<void> {
        if(port !== undefined) this.appOptions.port = port;
        let _this = this;
        // start up the server
        _this._server = http.createServer((req, res) => {
            _this._handleRequest(req, res)
                .then(() => {
                    // do nothing
                })
                .catch((error:any) => {
                    _this._handleError(req, res, error);
                })
                .finally(() => {
                    res.end();
                });
        });
        _this._server.listen(this.appOptions.port);
    }
}
