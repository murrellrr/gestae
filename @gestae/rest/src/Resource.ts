import { Part } from "./Part";
import { HttpMethod, IHttpContext } from "./HttpContext";
import { EventRegister, GestaeHttpEvent } from "./GestaeEvent";
import { BadRequestError } from "./GestaeError";
import { DefaultModel, Model } from "./Model";

export enum ResourceMethod {
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete"
}

export interface ResourceOptions {
    validate?: boolean;
    useSchemaAsDefaults?: boolean;
    schema?: object;
    lazyLoad?: boolean;
};

export class Resource extends Part {
    static readonly Events: Record<string, EventRegister>  = {
        // Create:POST
        OnBeforeCreate: {operation: "create", event: "before"}, 
        OnCreate:       {operation: "create", event: "on"}, 
        OnAfterCreate:  {operation: "create", event: "after"}, 
        // Read:GET
        OnBeforeRead:   {operation: "read",   event: "before"}, 
        OnRead:         {operation: "read",   event: "on"}, 
        OnAfterRead:    {operation: "read",   event: "after"}, 
        // Update:PUT
        OnBeforeUpdate: {operation: "update", event: "before"}, 
        OnUpdate:       {operation: "update", event: "on"}, 
        OnAfterUpdate:  {operation: "update", event: "after"}, 
        // Delete:DELETE
        OnBeforeDelete: {operation: "delete", event: "before"}, 
        OnDelete:       {operation: "delete", event: "on"}, 
        OnAfterDelete:  {operation: "delete", event: "after"}, 
        // Find:GET with query params
        OnBeforeFind:   {operation: "find",   event: "before"}, 
        OnFind:         {operation: "find",   event: "on"}, 
        OnAfterFind:    {operation: "find",   event: "after"}, 
    };

    private readonly _options: ResourceOptions;
    private readonly _ModelClass: new (...args: any[]) => Model;

    constructor(model: Model, options: ResourceOptions = {}) {
        super(model);
        this._ModelClass = Object.getPrototypeOf(model).constructor;
        this._options = options;
    }

    get type(): string {
        return "resource";
    }

    protected async _emitGet(context: IHttpContext, instance: object) {
        context.logger.debug(`Resource emitting GET event for ${this._path}`);

        // Fire the read events no matter what.
        let _event = GestaeHttpEvent.createHttpEvent(
            GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnBeforeRead), context, instance);

        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnRead);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnAfterRead);
        await context.applicationContext.events.emit(_event);
    }

    protected async _emitFind(context: IHttpContext, instance: object) {
        // Fire the find events no matter what.
        let _event = GestaeHttpEvent.createHttpEvent(
            GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnBeforeFind), context, instance);

        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnFind);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnAfterFind);
        await context.applicationContext.events.emit(_event);
    }

    protected async _emitCreate(context: IHttpContext, instance: object) {
        // Fire the create events no matter what.
        let _event = GestaeHttpEvent.createHttpEvent(
            GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnBeforeCreate), context, instance);

        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnCreate);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnAfterCreate);
        await context.applicationContext.events.emit(_event);
    }

    protected async _emitPut(context: IHttpContext, instance: object) {
        // Fire the update events no matter what.
        let _event = GestaeHttpEvent.createHttpEvent(
            GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnBeforeUpdate), context, instance);

        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnUpdate);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnAfterUpdate);
        await context.applicationContext.events.emit(_event);
    }

    protected async _emitDelete(context: IHttpContext, instance: object) {
        // Fire the delete events no matter what.
        let _event = GestaeHttpEvent.createHttpEvent(
            GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnBeforeDelete), context, instance);

        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnDelete);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Resource.Events.OnAfterDelete);
        await context.applicationContext.events.emit(_event);
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        const { request } = context;
        const { uri, isCreate, isFind, method } = request;

        // Handle Create (POST) or Find (GET with query params)
        //if(isCreate || isFind)
        //    return uri.hasNext() ? this._emitGet(context) : this._emitFind(context);
    
        // Ensure an ID exists for non-Create/Find operations
        if(!uri.hasNext()) throw new BadRequestError("Resource ID is required.");
        const _id = uri.next(); // Extract the resource ID
        let _instance = new this._ModelClass(_id); // Create an instance of the model
    
        // If there is more in the path, delegate as a GET request
        // We just need to look it up for later use in the request.
        if(uri.hasNext()) return this._emitGet(context, _instance);
    
        // Process the CRUD operation
        switch(method) {
            case HttpMethod.GET:
                return this._emitGet(context, _instance);
            case HttpMethod.POST:
                return this._emitCreate(context, _instance);
            case HttpMethod.PUT:
            case HttpMethod.PATCH:
                return this._emitPut(context, _instance);
            case HttpMethod.DELETE:
                return this._emitDelete(context, _instance);
            default:
                throw new BadRequestError(`HTTP method '${method}' is invalid in the context of a resource.`);
        }
    }

    public static create(model: Model | string, options: ResourceOptions = {}): Resource {
        if(typeof model === "string") model = new DefaultModel(model);
        return new Resource(model, options);
    }
}