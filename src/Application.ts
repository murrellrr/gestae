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
    ApplicationContext,
    IApplicationContext, 
    InitializationContext
} from "./ApplicationContext";
import { 
    IOptions, 
} from "./Gestae";
import { 
    NamespaceNodeFactory, 
} from "./NamespaceNode";
import { 
    AbstractNode, 
    INode 
} from "./Node";
import { ResourceNodeFactory } from "./ResourceNode";
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
import { GestaeError } from "./GestaeError";
import { 
    EventFeatureFactory, 
    EventRegisterType, 
    GestaeEvent
} from "./GestaeEvent";
import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { SchemaFeatureFactory } from "./Schema";
import { 
    INodeTemplate, 
    NodeTemplateType, 
    NodeTemplate 
} from "./NodeTemplate";
import { AbstractNodeFactoryChain } from "./AbstractNodeFactoryChain";

import { 
    HttpRequestHandler 
} from "./HttpRequestHandler";
import { SearchableResourceFeatureFactory } from "./Search";
import { 
    HttpResponseBody, 
    HttpRequestBody, 
    JSONRequestBody,
    JSONResponseBody
} from "./HttpRequestBody";
import http from "node:http";
import { ResourceFeatureFactory } from "./ResourceActions";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const VERSION = "1.0.0";

const DEFAULT_NAME               = "app";
const DEFAULT_PORT               = 3000;
const DEFAULT_ROOT               = "/";
const DEFAULT_REQUEST_SIZE_MB    = 5;
const DEFAULT_REQUEST_TIMEOUT_MS = 5;

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const ApplicationEvents = {
    Initialize: {
        OnBefore: {operation: "initialize", action: "before"} as EventRegisterType,
        On:       {operation: "initialize", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "initialize", action: "after" } as EventRegisterType,
    },
    Start: {
        OnBefore: {operation: "start", action: "before"} as EventRegisterType,
        On:       {operation: "start", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "start", action: "after" } as EventRegisterType,
    },
    Finalize: {
        OnBefore: {operation: "finalize", action: "before"} as EventRegisterType,
        On:       {operation: "finalize", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "finalize", action: "after" } as EventRegisterType,
    },
    Error: {
        OnBefore: {operation: "error", action: "before"} as EventRegisterType,
        On:       {operation: "error", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "error", action: "after" } as EventRegisterType,
    }
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type LoggerFactoryType = (options?: ILoggerOptions) => ILogger;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type PropertyFactoryType = (options?: IPropertyOptions) => Properties;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type NodeChainFactoryType = (context: IApplicationContext) => AbstractNodeFactoryChain<any, any>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type FeatureChainFactoryType = (context: IApplicationContext) => AbstractFeatureFactoryChain<any>;

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
    requestSizeMB?:       number;
    requestTimeoutMS?:    number;
    nodeChainFactory?:    NodeChainFactoryType;
    featureChainFactory?: FeatureChainFactoryType;
    logger?:              ILoggerOptions;
    loggerFactory?:       LoggerFactoryType;
    properties?:          IPropertyOptions;
    propertyFactory?:     PropertyFactoryType;
    requestBody?:         HttpRequestBody<any>; 
    responseBody?:        HttpResponseBody<any>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class Application {
    protected          _server:      http.Server | undefined;
    protected readonly _template:    NodeTemplate;
    protected          _root:        AbstractNode<any> | undefined;
    protected readonly _context:     ApplicationContext;
    protected readonly _properties:  Properties; 
    protected readonly sizeMB:       number;
    protected readonly timeoutMS:    number;
    protected readonly requestBody:  HttpRequestBody<any>;
    protected readonly responseBody: HttpResponseBody<any>;
    public    readonly options:      IApplicationOptions;
    public    readonly log:          ILogger;
    
    constructor(options: IApplicationOptions = {}) {
        this.options = options;
        // Setting up default options.
        options.name = options.name ?? DEFAULT_NAME;
        options.port = options.port ?? DEFAULT_PORT;
        options.tls  = options.tls  ?? false;
        if(options.tls && (!options.privateKeyPath || !options.publicKeyPath))
            throw GestaeError.toError(`TLS is enabled but no key paths are provided. Please set privateKeyPath and publicKeyPath in options.`);

        // Request
        options.requestSizeMB    = options.requestSizeMB    ?? DEFAULT_REQUEST_SIZE_MB;
        options.requestTimeoutMS = options.requestTimeoutMS ?? DEFAULT_REQUEST_TIMEOUT_MS;
        options.requestBody      = options.requestBody      ?? new JSONRequestBody();
        options.responseBody     = options.responseBody     ?? new JSONResponseBody();
        this.sizeMB              = options.requestSizeMB;
        this.timeoutMS           = options.requestTimeoutMS;
        this.requestBody         = options.requestBody;
        this.responseBody        = options.responseBody;

        // Logger.
        options.loggerFactory = options.loggerFactory ?? DefaultLogger.create;
        options.logger        = options.logger ?? {name: options.name};
        options.logger.name   = options.logger.name ?? options.name;
        this.log              = options.loggerFactory(options.logger);

        // Properties.
        options.propertyFactory = options.propertyFactory ?? BaseProperties.create;
        options.properties = options.properties ?? {cache: false};
        this._properties = options.propertyFactory(options.properties);                                   

        // Context.
        this._context = ApplicationContext.create(this.log, this._properties, options);

        // Node factories and features.
        options.nodeChainFactory = options.nodeChainFactory ?? 
                                    ((context: IApplicationContext): AbstractNodeFactoryChain<any, any> => 
                                         new NamespaceNodeFactory(context, 
                                             new ResourceNodeFactory(context)));
        options.featureChainFactory = options.featureChainFactory ?? 
                                   ((context: IApplicationContext): AbstractFeatureFactoryChain<any> => 
                                        new EventFeatureFactory(context,  
                                            new SchemaFeatureFactory(context, 
                                                new SearchableResourceFeatureFactory(context, 
                                                    new ResourceFeatureFactory(context)))));
        
        // Application Root.
        options.root = options.root ?? DEFAULT_ROOT;
        this._template = NodeTemplate.create(options.root);
    }

    get root(): INode | undefined {
        return this._root;
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

    get context(): IApplicationContext {
        return this._context;
    }

    addTemplate(template: NodeTemplateType, bindings?: Record<string, any>): INodeTemplate {
        return this._template.addTemplate(template);
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

    protected async onInitialize(): Promise<void> {
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

    protected async onStart(): Promise<void> {
        const _handler = HttpRequestHandler.create(this._context, this._root!,
                                                   this.requestBody, this.responseBody, 
                                                   this.sizeMB, this.timeoutMS); // Setting up the request handler.
        this._server = http.createServer(async (req, res) => {
            await _handler.handleRequest(req, res);
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
        await this.onInitialize();
        await this.onStart();
        this.log.info(`Application '${this.name}' started on port ${this.port}.`);
        return this;
    }
}