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
    defaultFeatureChainFactory,
    defaultNodeChainFactory,
    IOptions, 
} from "../Gestae";
import { INode } from "../node/INode";
import { AbstractNode } from "../node/AbstractNode";
import { 
    ILogger, 
    ILoggerOptions 
} from "../log/ILogger";
import { DefaultLogger } from "../log/DefaultLogger";
import { 
    IPropertyOptions, 
    Properties 
} from "../properties/Properties";
import { GestaeError } from "../error/GestaeError";
import { 
    createApplicationEventPath,
    createHttpEventPath,
    GestaeEvent
} from "../events/GestaeEvent";
import { AbstractFeatureFactoryChain } from "../node/AbstractFeatureFactoryChain";
import { 
    INodeTemplate, 
    NodeTemplateType, 
    NodeTemplate 
} from "../node/NodeTemplate";
import { AbstractNodeFactoryChain } from "../node/AbstractNodeFactoryChain";
import { 
    HttpRequestHandler 
} from "../http/HttpRequestHandler";
import { JSONRequestBody } from "../http/JSONRequestBody";
import { JSONResponseBody } from "../http/JSONResponseBody";
import { BaseProperties } from "../properties/BaseProperties";
import { ApplicationContext } from "./ApplicationContext";
import { IApplicationContext } from "./IApplicationContext";
import { InitializationContext } from "./InitializationContext";
import { AbstractHttpResponseBody } from "../http/AbstractHttpResponseBody";
import { AbstractHttpRequestBody } from "../http/AbstractHttpRequestBody";
import { AbstractPlugin, IPluginOptions } from "../plugins/AbstractPlugin";
import { IApplication } from "./IApplication";
import { IProperties } from "../properties/IProperties";
import { ApplicationEvent, ApplicationEvents } from "./ApplicationEvent";
import http from "node:http";

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
    requestBody?:         AbstractHttpRequestBody<any>; 
    responseBody?:        AbstractHttpResponseBody<any>;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class Application implements IApplication {
    protected          _server:      http.Server | undefined;
    protected readonly _template:    NodeTemplate;
    protected          _root:        AbstractNode<any> | undefined;
    protected readonly _context:     ApplicationContext;
    protected readonly _properties:  Properties; 
    public             sizeMB:       number;
    public             timeoutMS:    number;
    public             requestBody:  AbstractHttpRequestBody<any>;
    public             responseBody: AbstractHttpResponseBody<any>;
    public    readonly options:      IApplicationOptions;
    public    readonly log:          ILogger;
    
    /**
     * @description Creates a new instance of the Gestae Application.
     * @param options Configuration options for controlling Gestae during runtime.
     */
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
        options.properties      = options.properties ?? {cache: false};
        this._properties        = options.propertyFactory(options.properties);                                   

        // Context.
        this._context = ApplicationContext.create(this);

        // Node factories and features.
        options.nodeChainFactory    = options.nodeChainFactory    ?? defaultNodeChainFactory;
        options.featureChainFactory = options.featureChainFactory ?? defaultFeatureChainFactory;
        
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

    get properties(): IProperties {
        return this._properties;
    }

    addTemplate(template: NodeTemplateType, options?: IOptions): INodeTemplate {
        return this._template.addTemplate(template, options);
    }

    addPlugin(plugin: AbstractPlugin<any>, options: IPluginOptions = {}): this {
        this._context.pluginManager.addPlugin(plugin, options);
        return this;
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

    protected async _emitBeforeInitialize(context: InitializationContext): Promise<void> {
        return this._context.eventEmitter.emit(
            new ApplicationEvent<InitializationContext>(this.context, context, 
                createApplicationEventPath(ApplicationEvents.Initialize.OnBefore)));
    }

    protected async _emitAfterInitialize(context: InitializationContext): Promise<void> {
        return this._context.eventEmitter.emit(
            new ApplicationEvent<InitializationContext>(this.context, context, 
                createApplicationEventPath(ApplicationEvents.Initialize.OnAfter)));
    }

    protected async _emitBeforeStart(): Promise<void> {
        return this._context.eventEmitter.emit(
            new ApplicationEvent<IApplication>(this.context, this, 
                createApplicationEventPath(ApplicationEvents.Start.OnBefore)));
    }

    protected async _emitAfterStart(): Promise<void> {
        return this._context.eventEmitter.emit(
            new ApplicationEvent<IApplication>(this.context, this, 
                createApplicationEventPath(ApplicationEvents.Start.OnAfter)));
    }

    protected async onInitialize(): Promise<void> {
        const _initContext: InitializationContext = 
            InitializationContext.create(this.context, this.options.nodeChainFactory!(this.context), 
                                         this.options.featureChainFactory!(this.context));

        // Fire the before initialize event.
        await this._emitBeforeInitialize(_initContext);

        // TODO: Initialize the plugins.

        // Initialize the templates to nodes.
        this._root = await this._template.convert(_initContext);

        // Initialize the nodes.
        await this._root.initialize(_initContext);
        this.log.debug(`Application '${this.name}' initialized on root '${this._root.name}'.`);

        // Wrap up the events.
        await this._emitAfterInitialize(_initContext);
    }

    protected async onStart(): Promise<void> {
        await this._emitBeforeStart();
        const _handler = HttpRequestHandler.create(this._context, this._root!,
                                                   this.requestBody, this.responseBody, 
                                                   this.sizeMB, this.timeoutMS); // Setting up the request handler.
        this._server = http.createServer(async (req, res) => {
            await _handler.handleRequest(req, res, this._root!);
        });
        this._server.listen(this.port);
        await this._emitAfterStart();
    }

    async start(): Promise<IApplication> {
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