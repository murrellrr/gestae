/*
 *  Copyright (c) 2024, KRI, LLC.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { 
    DefaultApplicationContext,
    IApplicationContext, 
    InitializationContext
} from "./ApplicationContext";
import { 
    DefaultHttpContext, 
    HttpMethodEnum, 
    HttpRequest, 
    HttpResponse,
    IHttpResponse
} from "./HttpContext";
import { 
    IOptions, 
} from "./Gestae";
import { 
    NamespaceNodeFactory, 
} from "./Namespace";
import { AbstractNode } from "./AbstractNode";
import { ResourceNodeFactory } from "./Resource";
import { 
    DefaultLogger, 
    ILogger, 
    ILoggerOptions 
} from "./Logger";
import { 
    BaseProperties,
    IPropertyOptions, 
    Properties 
} from "./Properties";
import { GestaeError, MethodNotAllowedError } from "./GestaeError";
import { 
    EventFeatureFactory, 
    GestaeEvent 
} from "./GestaeEvent";
import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { SchemaFeatureFactory } from "./Schema";
import { 
    ITemplate, 
    NodeTemplateType, 
    Template 
} from "./Template";
import { AbstractNodeFactoryChain } from "./AbstractNodeFactoryChain";
import http from "node:http";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const VERSION = "1.0.0";

const DEFAULT_NAME = "app";
const DEFAULT_PORT = 3000;
const DEFAULT_ROOT = "/";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type LoggerFactoryType             = (options?: ILoggerOptions) => ILogger;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type PropertyFactoryType           = (options?: IPropertyOptions) => Properties;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type NodeChainFactoryType          = (context: IApplicationContext) => AbstractNodeFactoryChain<any, any>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type FeatureChainFactoryType       = (context: IApplicationContext) => AbstractFeatureFactoryChain<any>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IApplicationOptions extends IOptions {
    name?:                string;
    port?:                number;
    root?:                string;
    tls?:                 boolean;
    privateKeyPath?:      string;
    publicKeyPath?:       string;
    nodeChainFactory?:    NodeChainFactoryType;
    featureChainFactory?: FeatureChainFactoryType;
    logger?:              ILoggerOptions;
    loggerFactory?:       LoggerFactoryType;
    properties?:          IPropertyOptions;
    propertyFactory?:     PropertyFactoryType;    
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class Application {
    protected          _server:      http.Server | undefined;
    protected readonly _template:    Template;
    protected          _root:        AbstractNode<any> | undefined;
    protected readonly context:      IApplicationContext;
    public    readonly options:      IApplicationOptions;
    public    readonly log:          ILogger;
    public    readonly properties:   Properties; 
    
    constructor(options: IApplicationOptions = {}) {
        this.options = options;
        // Setting up default options.
        options.name = options.name ?? DEFAULT_NAME;
        options.port = options.port ?? DEFAULT_PORT;
        options.tls  = options.tls  ?? false;
        if(options.tls && (!options.privateKeyPath || !options.publicKeyPath))
            throw GestaeError.toError(`TLS is enabled but no key paths are provided. Please set privateKeyPath and publicKeyPath in options.`);

        // Logger.
        options.loggerFactory = options.loggerFactory ?? DefaultLogger.create;
        options.logger = options.logger ?? {name: options.name};
        options.logger.name = options.logger.name ?? options.name;
        this.log = options.loggerFactory(options.logger);

        // Properties.
        options.propertyFactory = options.propertyFactory ?? BaseProperties.create;
        options.properties = options.properties ?? {cache: false};
        this.properties = options.propertyFactory(options.properties);                                   

        // Context.
        this.context = DefaultApplicationContext.create(this.log, this.properties, options);
        options.nodeChainFactory = options.nodeChainFactory ?? 
                                    ((context: IApplicationContext): AbstractNodeFactoryChain<any, any> => 
                                         new NamespaceNodeFactory(context, 
                                             new ResourceNodeFactory(context)));
        options.featureChainFactory = options.featureChainFactory ?? 
                                   ((context: IApplicationContext): AbstractFeatureFactoryChain<any> => 
                                        new EventFeatureFactory(context,  
                                            new SchemaFeatureFactory(context)));
        
        // Application Root.
        options.root = options.root ?? DEFAULT_ROOT;
        this._template = Template.create(options.root);
    }

    get name(): string {
        return this.options.name!;
    }

    get port(): number {
        return this.options.port!;
    }

    get server(): http.Server | undefined {
        return this._server;
    }

    addNode(child: NodeTemplateType, bindings?: Record<string, any>): ITemplate {
        return this._template.addNode(child);
    }

    on<T, E extends GestaeEvent<T>>(event: string | RegExp, listener: (event: E) => Promise<void> | void, once?: boolean) : this {
        this.context.eventQueue.on(event, listener, once);
        return this;
    }

    once<T, E extends GestaeEvent<T>>(event: string | RegExp, listener: (event: E) => Promise<void> | void): this {
        this.context.eventQueue.once(event, listener);
        return this;
    }

    off<T, E extends GestaeEvent<T>>(event: string, listener: (event: E) => Promise<void> | void): this {
        this.context.eventQueue.off(event, listener);
        return this;
    }

    private async _initialize(): Promise<void> {
        //this.log.warn(`Application '${JSON.stringify(getGestaeMetadata(), null, 2)}'`);
        this.log.debug(`Initializing application '${this.name}'...`);
        const _initContext: InitializationContext = 
            InitializationContext.create(this.context, this.options.nodeChainFactory!(this.context), 
                                         this.options.featureChainFactory!(this.context));
        // Initialize the templates to nodes.
        this.log.debug("Converting templates...");
        this._root = await this._template.convert(_initContext);
        this.log.debug("Templates converted.");
        // Initialize the nodes.
        this.log.debug("Initializing nodes...");
        await this._root.initialize(_initContext);
        this.log.debug("Nodes initialized.");
        this.log.debug(`Application '${this.name}' initialized on root '${this._root.name}'.`);
    }

    private _handleError(req: HttpRequest, res: HttpResponse, error?: any): void {
        const _error = GestaeError.toError(error);
        this.log.error(`Error processing ${req.method} request ${req.url}:`);
        this.log.error(JSON.stringify(_error, null, 2));
        res.error(_error);
    }

    private async _start(): Promise<void> {
        const _this = this;
        this._server = http.createServer(async (req, res) => {
            const _req     = new HttpRequest(req);
            const _res     = new HttpResponse(res);
            const _context = DefaultHttpContext.create(this.context, _req, _res);
            try {
                if(_req.method === HttpMethodEnum.UNSUPPORTED)
                    _this._handleError(_req, _res, new MethodNotAllowedError(req.method!));
                else {
                    await this._root!.doRequest(_context);
                    if(_req.canceled) _this._handleError(_req, _res, _req.cause);
                    else {
                        _context.log.info(`Request processed with response code ${_res.code}.`);
                        if(this.context.log.level === "debug")
                            _context.log.debug(`Response: ${JSON.stringify(_res.body, null, 2)}`);
                    }
                }
            }
            catch(error) {
                _this._handleError(_req, _res, _req.cause);
            }
            finally {
                _res.write();
            }
        });
        this._server.listen(this.port);
    }

    async start(): Promise<Application> {
        console.log();
        console.log();
        console.log("   ________                 __              /\\  _____________________ ____________________ ");
        console.log("  /  _____/  ____   _______/  |______    ___\\ \\ \\______   \\_   _____//   _____/\\__    ___/ ");
        console.log(" /   \\  ____/ __ \\ /  ___/\\   __\\__  \\ _/ __ \\ \\ |       _/|    __)_ \\_____  \\   |    |    ");
        console.log(" \\    \\_\\  \\  ___/ \\___ \\  |  |  / __ \\  ___/ \\ \\|    |   \\|        \\/        \\  |    |    ");
        console.log("  \\______  /\\___  >____  > |__| (____  /\\___  >\\ \\____|_  /_______  /_______  /  |____|    ");
        console.log("         \\/     \\/     \\/            \\/     \\/  \\/      \\/        \\/        \\/             ");
        console.log("                         Copyright (c) 2025, KRI, LLC. MIT Licensed                         ");
        console.log("           Imparative, First-Class Resource, Async REST Framework for TypeScript.           ");
        console.log("                    Designed and intially developed by Robert R Murrell                     ");
        console.log();
        console.log();
        console.log(`                                  Version: ${VERSION}                                       `);
        console.log("    Visit https://gestaejs.com for documentation, latest features, and more information.    ");
        console.log("       You can also find us on github at git+https://github.com/murrellrr/gestae.git        ");
        console.log();
        console.log("Permission is hereby granted, free of charge, to any person obtaining a copy");
        console.log("of this software and associated documentation files (the \"Software\"), to deal");
        console.log("in the Software without restriction, including without limitation the rights");
        console.log("to use, copy, modify, merge, publish, distribute, sublicense, and/or sell");
        console.log("copies of the Software, and to permit persons to whom the Software is");
        console.log("furnished to do so, subject to the following conditions:");
        console.log();
        console.log("The above copyright notice and this permission notice shall be included in");
        console.log("all copies or substantial portions of the Software.");
        console.log();
        console.log("THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR");
        console.log("IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,");
        console.log("FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE");
        console.log("AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER");
        console.log("LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,");
        console.log("OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN");
        console.log("THE SOFTWARE.");
        console.log();
        this.log.info(`Starting application '${this.name}'...`);
        await this._initialize();
        await this._start();
        this.log.info(`Application '${this.name}' started on port ${this.port}.`);
        return this;
    }
}