import { IApplicationContext, createApplicationContext } from "./ApplicationContext";
import { IHttpContext, createHttpContext } from "./HttpContext"; 
import { GestaeError } from "./GestaeError";
import { Plugin } from "./Plugin";
import { Namespace } from "./Namespace";
import { ILogger, createLogger } from "./Logger";
import { Properties, createProperties } from "./Properties";
import { IAsyncEventQueue } from "./AsyncEventEmitter";
import { GestaeEvent } from "./GestaeEvent";
import { Action } from "./Action";
import { Resource } from "./Resource";
import http from 'http';
import { Part } from "./Part";
import { Model } from "./Model";

export const VERSION = "1.0.0";

type ApplicationContextFactory = (logger: ILogger, properties: Properties) => IApplicationContext;
type HttpContextFactory = (context: IApplicationContext, request: http.IncomingMessage, response: http.ServerResponse, logger: ILogger) => IHttpContext;
type LoggerFactory = (context?: object) => ILogger;
type PropertyFactory = (cached?:boolean) => Properties;

export type PluginConstructor<T> = new (...args: any[]) => T;

export interface IApplicationOptions {
    name?: string;
    port?: number;
    applicationContextFactory?: ApplicationContextFactory;
    httpContextFactory?: HttpContextFactory;
    loggerFactory?: LoggerFactory;
    propertyFactory?: PropertyFactory;
    cachedProperties?: boolean;
};

export interface IApplication extends IAsyncEventQueue {
    start(port?: number): Promise<IApplication>;
    get context(): IApplicationContext;
    addPlugin<T extends Plugin>(plugin: PluginConstructor<T>, instance: T): this;
    getPlugin<T extends Plugin>(plugin: PluginConstructor<T>): T | undefined;
}

export class Application implements IApplication {
    private readonly _root: Namespace;
    private readonly _context: IApplicationContext;
    private _server: http.Server | undefined;
    public readonly appOptions: IApplicationOptions;
    public readonly plugins: Map<string, Plugin> = new Map();
    
    constructor(options: IApplicationOptions = {}) {
        this._root = Namespace.create(options?.name ?? "api");
        this.appOptions = options;
        this.appOptions.port = options.port ?? 3000;
        this.appOptions.cachedProperties = options.cachedProperties ?? true;
        this.appOptions.applicationContextFactory = options.applicationContextFactory ?? 
                                                    createApplicationContext;
        this.appOptions.httpContextFactory = options.httpContextFactory ?? 
                                             createHttpContext;
        this.appOptions.loggerFactory = options.loggerFactory ?? createLogger;
        this.appOptions.propertyFactory = options.propertyFactory ?? createProperties;

        // Create the application context.
        this._context = this.appOptions.applicationContextFactory(this.appOptions.loggerFactory(
            {app: this._root.name}), createProperties(this.appOptions.cachedProperties)); // create the context with a logger
    }

    get context(): IApplicationContext {
        return this._context;
    }

    addChild(child: Part<any>): Part<any> {
        if(child instanceof Action || child instanceof Namespace || child instanceof Resource) {
            this._root.addChild(child);
            return child;
        }
        throw new GestaeError("Child must be of type Action, Namespace, or Resource.");
    }

    addPlugin<T extends Plugin>(_Plugin: PluginConstructor<T>, instance: T): this {
        if (!(instance instanceof Plugin))
            throw new GestaeError(`Instance must extend Plugin: ${_Plugin.name}`);
        this.plugins.set(_Plugin.name, instance);
        return this; // Enables daisy-chaining
    }

    getPlugin<T extends Plugin>(_Plugin: PluginConstructor<T>): T | undefined {
        return this.plugins.get(_Plugin.name) as T | undefined;
    }

    on<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void, once: boolean = false) : this {
        this._context.events.on(event, method);
        return this;
    }

    once<T, E extends GestaeEvent<T>>(event: string | RegExp, method: (event: E) => Promise<void> | void): this {
        this._context.events.once(event, method);
        return this;
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
        if(!this.appOptions.httpContextFactory)
            throw new GestaeError("httpContextFactory is not defined");
        const _requestContext: IHttpContext = this.appOptions.httpContextFactory(this.context, req, res,
            this._context.logger.child({
                ssl: this._isSecureRequest(req), 
                host: req.headers.host, 
                path: req.url
            })
        );
        await this._root.doRequest(_requestContext);
    }

    private _handleError(req: http.IncomingMessage, res: http.ServerResponse, error: any): void {
        this._context.logger.error(error);
        let _error = GestaeError.toError(error);
        res.writeHead(_error.code, _error.message, {"Content-Type": "application/json"});
        res.write(JSON.stringify(_error.safe(), null, 2));
    }

    private async _startServer(): Promise<void> {
        let _this = this;
        // start up the server
        _this._context.logger.info(`Starting ${this._root.name} on port ${this.appOptions.port}.`);
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
        await this._root.initialize(this.context); // Initialize ALL the Parts throughout the hierarchy.
        await this._startServer();
    }

    async start(port?: number): Promise<IApplication> {
        console.log("   ________                 __              /\\  _____________________ ____________________ ");
        console.log("  /  _____/  ____   _______/  |______    ___\\ \\ \\______   \\_   _____//   _____/\\__    ___/ ");
        console.log(" /   \\  ____/ __ \\ /  ___/\\   __\\__  \\ _/ __ \\ \\ |       _/|    __)_ \\_____  \\   |    |    ");
        console.log(" \\    \\_\\  \\  ___/ \\___ \\  |  |  / __ \\  ___/ \\ \\|    |   \\|        \\/        \\  |    |    ");
        console.log("  \\______  /\\___  >____  > |__| (____  /\\___  >\\ \\____|_  /_______  /_______  /  |____|    ");
        console.log("         \\/     \\/     \\/            \\/     \\/  \\/      \\/        \\/        \\/             ");
        console.log("             Copyright (c) 2025, Dark Fox Technology, LLC. All Rights Reserved              ");
        console.log("             Imparative, Event-based REST Framework for Node.js and TypeScript.             ");
        console.log("                   Designed and intially developed by Robert R Murrell                      ");
        console.log();
        console.log();
        console.log(`Version: ${VERSION}`);
        console.log("Visit https://gestaejs.com for more socumentation, latest features, and more information.   ");
        console.log("You can also find us on github at git+https://github.com/murrellrr/gestae.git");
        console.log();
        console.log();
        
        if(port !== undefined) this.appOptions.port = port;
        await this._start();

        return this;
    }
}
