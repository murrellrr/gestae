import { AbstractHttpRequestBody } from "../http/AbstractHttpRequestBody";
import { ILogger } from "../log/ILogger";
import { IProperties } from "../properties/IProperties";
import { AbstractHttpResponseBody } from "../http/AbstractHttpResponseBody";
import { GestaeEvent } from "../events/GestaeEvent";
import { AbstractPlugin, IPluginOptions } from "../plugins/AbstractPlugin";
import { IOptions } from "../Gestae";
import { NodeTemplateType, INodeTemplate } from "../node/NodeTemplate";
import { INode } from "../node/INode";
import * as http from "http";


export interface IApplication {
    get root(): INode | undefined;
    get name(): string;
    get port(): number;
    get server(): http.Server | undefined;
    get log():        ILogger;
    get properties(): IProperties;
    get sizeMB():       number;
    set sizeMB(sizeMB: number);
    get timeoutMS():    number;
    set timeoutMS(timeoutMS: number);
    get requestBody():  AbstractHttpRequestBody<any>;
    set requestBody(requestBody: AbstractHttpRequestBody<any>);
    get responseBody(): AbstractHttpResponseBody<any>;
    set responseBody(responseBody: AbstractHttpResponseBody<any>);
    addTemplate(template: NodeTemplateType, options?: IOptions): INodeTemplate;
    addPlugin(plugin: AbstractPlugin<any>, options?: IPluginOptions): this;
    on<T, E extends GestaeEvent<T>>(event: string | RegExp, listener: (event: E) => Promise<void> | void, once?: boolean) : this;
    once<T, E extends GestaeEvent<T>>(event: string | RegExp, listener: (event: E) => Promise<void> | void): this;
    off<T, E extends GestaeEvent<T>>(event: string, listener: (event: E) => Promise<void> | void): this;
}