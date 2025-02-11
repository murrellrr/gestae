import { Part } from "./Part";
import { IRequestContext } from "./RequestContext";

export enum ResourceMethod {
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete"
}

export enum ResourceEvents {
    OnBeforeCreate = "create/OnBefore",
    OnCreate = "gestaejs.com/api/events/resource/create/On",
    OnAfterCreate = "gestaejs.com/api/event/resource/create/OnAfter",
    OnBeforeRead = "gestaejs.com/api/event/resource/read/OnBefore",
    OnRead = "gestaejs.com/api/event/resource/read/On",
    OnAfterRead = "gestaejs.com/api/event/resource/read/OnAfter",
    OnBeforeUpdate = "gestaejs.com/api/event/resource/update/OnBefore",
    OnUpdate = "gestaejs.com/api/event/resource/update/On",
    OnAfterUpdate = "gestaejs.com/api/event/resource/update/OnAfter",
    OnBeforeDelete = "gestaejs.com/api/event/resource/delete/OnBefore",
    OnDelete = "gestaejs.com/api/event/resource/delete/On",
    OnAfterDelete = "gestaejs.com/api/event/resource/delete/OnAfter"
}

export interface IResourceOptions {
    name?: string;
    validate?: boolean;
    useSchemaAsDefaults?: boolean;
    schema?: object;
};

export class Resource extends Part {
    public readonly options: IResourceOptions;

    constructor(name?: string, options: Partial<IResourceOptions> = {}) {
        super(name ?? options.name ?? new.target.name);
        this.options = options;

        // set up the core defaults:
        this.options.validate = this.options.validate ?? false;
        this.options.schema = this.options.schema ?? {};
        this.options.useSchemaAsDefaults = this.options.useSchemaAsDefaults ?? false;
    }

    get validate(): boolean {
        return this.options.validate ?? false;
    }

    get useSchemaAsDefaults(): boolean {
        return this.options.useSchemaAsDefaults ?? false;
    }

    get schema(): object {
        return this.options.schema ?? {};
    }

    async _do(context: IRequestContext): Promise<boolean> {
        context.logger.debug(`Processing Resource '${this.name}'.`);

        // Looking to see if the next part is present, thats required for a GET
        if(context.request.uri.hasNext()) {
            // If we have a next part, we are looking at a specific resource.
            let _id = context.request.uri.next();
            
            // Checking to see if there is more on the path, if  so, we only 
            // need to GET, otherwise we are the last stop.
        }
        else {
            // Checking to see if we are a method that requires an id.
        }

        return true;
    }

    public static create(name: string, options: Partial<IResourceOptions> = {}): Resource {
        return new Resource(name, options);
    }
}