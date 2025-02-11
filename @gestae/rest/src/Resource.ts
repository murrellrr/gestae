import { Part } from "./Part";
import { IRequestContext } from "./RequestContext";

export enum ResourceMethod {
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete"
}

export interface IResourceOptions {
    schema?: object;
    validate?: boolean;
    useSchemaAsDefaults?: boolean;
};

export class Resource extends Part {
    public static readonly Events = {
        OnBeforeCreate: "gestaejs.com/api/event/resource/create/OnBefore",
        OnCreate: "gestaejs.com/api/events/resource/create/On",
        OnAfterCreate: "gestaejs.com/api/event/resource/create/OnAfter",
        OnBeforeRead: "gestaejs.com/api/event/resource/read/OnBefore",
        OnRead: "gestaejs.com/api/event/resource/read/On",
        OnAfterRead: "gestaejs.com/api/event/resource/read/OnAfter",
        OnBeforeUpdate: "gestaejs.com/api/event/resource/update/OnBefore",
        OnUpdate: "gestaejs.com/api/event/resource/update/On",
        OnAfterUpdate: "gestaejs.com/api/event/resource/update/OnAfter",
        OnBeforeDelete: "gestaejs.com/api/event/resource/delete/OnBefore",
        OnDelete: "gestaejs.com/api/event/resource/delete/On",
        OnAfterDelete: "gestaejs.com/api/event/resource/delete/OnAfter"
    };

    constructor(name: string, public readonly options: IResourceOptions = {}) {
        super(name);
    }

    async _do(context: IRequestContext): Promise<boolean> {
        // Looking to see if the next part is present, thats required for a GET
        if(context.request.uri.hasNext()) {
            // If we have a next part, we are looking at a specific resource.
            let _id = context.request.uri.next();
            
            // Checking to see if there is more on the path, if  so, we only 
            // need to GET, otherwise we are the last stop.
        }

        console.log(`Did namespace ${this.name}.`);
        return true;
    }

    public static create(name: string, options: IResourceOptions = {}): Resource {
        return new Resource(name, options);
    }
}