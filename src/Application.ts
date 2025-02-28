
import { AbstractPartFactoryChain } from "./AbstractPartFactoryChain";
import { 
    DefaultApplicationContext, 
    FeatureChainFactoryType, 
    IApplicationContext, 
    IApplicationContextOptions,
    PartChainFactoryType
} from "./ApplicationContext";
import { 
    DefaultHttpContext, 
    IHttpContext 
} from "./HttpContext";
import { 
    ClassType, 
    IClassOptions 
} from "./Gestae";
import { 
    DefaultNamespace,
    NamespacePart, 
    NamespacePartFactory 
} from "./Namespace";
import { IPart } from "./Part";
import { ResourcePartFactory } from "./Resource";
import http from "node:http";
import { DefaultLogger, ILogger, ILoggerOptions } from "./Logger";
import { BaseProperties, IPropertyOptions, Properties } from "./Properties";
import { GestaeError } from "./GestaeError";
import { EventFeatureFactory, GestaeEvent } from "./GestaeEvent";
import { AbstractFeatureFactoryChain } from "./AbstractFeatureFactoryChain";
import { TaskFeatureFactory } from "./Task";
import { SchemaFeatureFactory } from "./Schema";

export const VERSION = "1.0.0";

const DEFAULT_NAME = "app";
const DEFAULT_PORT = 3000;
const DEFAULT_ROOT = "/";

export type ApplicationContextFactoryType = (options: IApplicationContextOptions) => IApplicationContext;
export type HttpContextFactoryType = (request: http.IncomingMessage, response: http.ServerResponse) => IHttpContext;
export type LoggerFactoryType = (options?: ILoggerOptions) => ILogger;
export type PropertyFactoryType = (options?: IPropertyOptions) => Properties;

export interface IApplicationOptions extends IClassOptions {
    name?:                      string;
    port?:                      number;
    root?:                      string;
    tls?:                       boolean;
    privateKeyPath?:            string;
    publicKeyPath?:             string;
    applicationContextFactory?: ApplicationContextFactoryType;
    httpContextFactory?:        HttpContextFactoryType;
    partChainFactory?:          PartChainFactoryType;
    featureChainFactory?:       FeatureChainFactoryType;
    loggerOptions?:             ILoggerOptions;
    loggerFactory?:             LoggerFactoryType;
    propertyOptions?:           IPropertyOptions;
    propertyFactory?:           PropertyFactoryType;      
}

export class Application {
    protected readonly _partFactory: AbstractPartFactoryChain<any, any>;
    protected readonly _root:        NamespacePart;
    protected readonly context:      IApplicationContext;
    public    readonly options:      IApplicationOptions;
    public    readonly log:          ILogger;
    public    readonly properties:   Properties; 
    
    constructor(options: IApplicationOptions = {}) {
        this.options = options;
        options.name = options.name ?? DEFAULT_NAME;
        options.port = options.port ?? DEFAULT_PORT;
        options.root = options.root ?? DEFAULT_ROOT;
        options.tls  = options.tls  ?? false;

        if(options.tls && (!options.privateKeyPath || !options.publicKeyPath))
            throw GestaeError.toError(`TLS is enabled but no key paths are provided. Please set privateKeyPath and publicKeyPath in options.`);

        // Logger.
        options.loggerFactory = options.loggerFactory ?? DefaultLogger.create;
        options.loggerOptions = options.loggerOptions ?? {name: options.name};
        this.log = options.loggerFactory(options.loggerOptions);

        // Properties.
        options.propertyFactory = options.propertyFactory ?? BaseProperties.create;
        options.propertyOptions = options.propertyOptions ?? {cache: false};
        this.properties = options.propertyFactory(options.propertyOptions);

        // Application Context and Part Factory.
        options.applicationContextFactory = options.applicationContextFactory ?? 
                                            DefaultApplicationContext.create;
        options.partChainFactory = options.partChainFactory ?? 
                                   ((context: IApplicationContext): AbstractPartFactoryChain<any, any> => 
                                        new NamespacePartFactory(context, 
                                            new ResourcePartFactory(context)));
        options.featureChainFactory = options.featureChainFactory ?? 
                                   ((context: IApplicationContext): AbstractFeatureFactoryChain<any> => 
                                        new EventFeatureFactory(context, 
                                            new TaskFeatureFactory(context, 
                                                new SchemaFeatureFactory(context))));
        this.context = options.applicationContextFactory({log: this.log, properties: this.properties, 
                                                          partChainFactory: options.partChainFactory, 
                                                          featureChainFactory: options.featureChainFactory});
        this._partFactory = options.partChainFactory(this.context);

        // Application Root.
        this.log.debug(`Creating application root '${options.root}'.`);
        if(options.root === DEFAULT_ROOT)
            this._root = new NamespacePart(DefaultNamespace, this.context, {name: options.root});
        else {
            const _results = this.context.partFactory.create(options.root);
            this._root = _results.bottom ?? _results.top;
        }
    }

    get name(): string {
        return this.options.name!;
    }

    get port(): number {
        return this.options.port!;
    }

    add(child: ClassType | string): IPart {
        return this._root.add(child);
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
        await this._root.initialize();
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
        console.log();
        await this._initialize();
        return this;
    }
}