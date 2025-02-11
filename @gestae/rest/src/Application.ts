import { IApplicationContext, createApplicationContext } from "./ApplicationContext";
import { IRequestContext, createRequestContext } from "./RequestContext"; 
import { GestaeError } from "./GestaeError";
import { Plugin } from "./Plugin";
import http from 'http';
import { INamespaceOptions, Namespace } from "./Namespace";
import { ILogger, createLogger } from "./Logger";
import { Properties, createProperties } from "./Properties";

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

type ApplicationContextFactory = (logger: ILogger, properties: Properties) => IApplicationContext;
type RequestContextFactory = (context: IApplicationContext, request: http.IncomingMessage, logger: ILogger) => IRequestContext;
type LoggerFactory = (context?: object) => ILogger;
type PropertyFactory = (cached?:boolean) => Properties;

export interface IApplicationOptions extends INamespaceOptions {
    name?: string;
    port?: number;
    applicationContextFactory?: ApplicationContextFactory;
    requestContextFactory?: RequestContextFactory;
    loggerFactory?: LoggerFactory;
    propertyFactory?: PropertyFactory;
    cachedProperties?: boolean;
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
        this.appOptions.cachedProperties = options.cachedProperties ?? true;
        this.appOptions.applicationContextFactory = options.applicationContextFactory ?? 
                        createApplicationContext;
        this.appOptions.requestContextFactory = options.requestContextFactory ?? 
                        createRequestContext;
        this.appOptions.loggerFactory = options.loggerFactory ?? createLogger;
        this.appOptions.propertyFactory = options.propertyFactory ?? createProperties;

        // Create the application context.
        this._context = this.appOptions.applicationContextFactory(this.appOptions.loggerFactory(
            {app: this.name}), createProperties(this.appOptions.cachedProperties)); // create the context with a logger
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

    /**
     * Detects if an HTTP request was made over SSL/TLS (HTTPS).
     * Supports both direct HTTPS connections and reverse proxy headers.
     * 
     * @param req - The IncomingMessage (HTTP request).
     * @returns `true` if the request was over HTTPS, `false` otherwise.
     */
    private _isSecureRequest(req: http.IncomingMessage): boolean {
        // Direct HTTPS connection (native TLS)
        if(req.socket && (req.socket as any).encrypted) return true;

        // Behind a reverse proxy (e.g., Nginx, AWS ALB)
        const forwardedProto = req.headers["x-forwarded-proto"];
        if(typeof forwardedProto === "string" && forwardedProto.toLowerCase() === "https")
            return true;

        return false;
    }

    private async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        if (!this.appOptions.requestContextFactory)
            throw new GestaeError("requestContextFactoryContextFactory is not defined");
        const _requestContext: IRequestContext = this.appOptions.requestContextFactory(this.context, req, 
            this._context.logger.child({
                ssl: this._isSecureRequest(req), 
                host: req.headers.host, 
                path: req.url
            })
        );
        await this.do(_requestContext);
    }

    private _handleError(req: http.IncomingMessage, res: http.ServerResponse, error: any): void {
        res.writeHead(500, error.message, {"Content-Type": "application/json"});
        res.write(JSON.stringify(error, null, 2));
    }

    private async _startServer(): Promise<void> {
        let _this = this;
        // start up the server
        _this._context.logger.info(`Starting ${this.name} on port ${this.appOptions.port}.`);
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

    private async _start() {
        await this.initialize(this.context); // Initialize ALL the Parts throughout the hierarchy.
        await this._startServer();
    }

    async start(port?:number): Promise<this> {
        console.log("   ________                 __              /\\  _____________________ ____________________ ");
        console.log("  /  _____/  ____   _______/  |______    ___\\ \\ \\______   \\_   _____//   _____/\\__    ___/ ");
        console.log(" /   \\  ____/ __ \\ /  ___/\\   __\\__  \\ _/ __ \\ \\ |       _/|    __)_ \\_____  \\   |    |    ");
        console.log(" \\    \\_\\  \\  ___/ \\___ \\  |  |  / __ \\  ___/ \\ \\|    |   \\|        \\/        \\  |    |    ");
        console.log("  \\______  /\\___  >____  > |__| (____  /\\___  >\\ \\____|_  /_______  /_______  /  |____|    ");
        console.log("         \\/     \\/     \\/            \\/     \\/  \\/      \\/        \\/        \\/             ");
        console.log("             Copyright (c) 2025, Dark Fox Technology, LLC. All Rights Reserved              ");
        console.log("");
        
        if(port !== undefined) this.appOptions.port = port;
        await this._start();

        return this;
    }
}
