import { Part, ModelType, PartOptions } from "./Part";
import { HttpMethod, IHttpContext } from "./HttpContext";
import { EventRegister, GestaeHttpEvent } from "./GestaeEvent";
import { BadRequestError } from "./GestaeError";

export interface ResourceOptions extends PartOptions {
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
    //private readonly _ModelConstructor: new (...args: any[]) => Model;

    constructor(model: ModelType, options: ResourceOptions = {}) {
        super(model, options);
        //this._ModelConstructor = this._ModelClass.constructor as new (...args: any[]) => Model;
        this._options = options;
    }

    get type(): string {
        return "resource";
    }

    /**
     * @description Emit the Read lifecycle events for the resource.
     * @param context The HTTP context of the request.
     * @param target The target model instance.
     */
    protected async _emitRead(context: IHttpContext, target: object): Promise<void> {
        // Fire the read events no matter what.
        let _event = GestaeHttpEvent.createHttpEventNoPath(context, target);
        return this.emitLifecycle(_event, Resource.Events.OnRead.operation, target);
    }

    protected async _emitFind(context: IHttpContext, target: object): Promise<void> {
        // Fire the find events no matter what.
        let _event = GestaeHttpEvent.createHttpEventNoPath(context, target);
        return this.emitLifecycle(_event, Resource.Events.OnFind.operation, target);
    }

    protected async _emitCreate(context: IHttpContext, target: object): Promise<void> {
        // Fire the create events no matter what.
        let _event = GestaeHttpEvent.createHttpEventNoPath(context, target);
        return this.emitLifecycle(_event, Resource.Events.OnCreate.operation, target);
    }

    protected async _emitUpdate(context: IHttpContext, target: object): Promise<void> {
        // Fire the update events no matter what.
        let _event = GestaeHttpEvent.createHttpEventNoPath(context, target);
        return this.emitLifecycle(_event, Resource.Events.OnUpdate.operation, target);
    }

    protected async _emitDelete(context: IHttpContext, target: object): Promise<void> {
        // Fire the delete events no matter what.
        let _event = GestaeHttpEvent.createHttpEventNoPath(context, target);
        return this.emitLifecycle(_event, Resource.Events.OnDelete.operation, target);
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
        let _target = this.createModelInstance(_id); // Create an instance of the model
    
        // If there is more in the path, delegate as a GET request
        // We just need to look it up for later use in the request.
        if(uri.hasNext()) return this._emitRead(context, _target);
    
        // Process the CRUD operation
        switch(method) {
            case HttpMethod.GET:
                return this._emitRead(context, _target);
            case HttpMethod.POST:
                return this._emitCreate(context, _target);
            case HttpMethod.PUT:
            case HttpMethod.PATCH:
                return this._emitUpdate(context, _target);
            case HttpMethod.DELETE:
                return this._emitDelete(context, _target);
            default:
                throw new BadRequestError(`HTTP method '${method}' is invalid in the context of a resource.`);
        }
    }

    public static create(model: ModelType, options: ResourceOptions = {}): Resource {
        return new Resource(model, options);
    }
}