import { IHttpContext } from "../../http/IHttpContext";
import { IResourceNode } from "./IResourceNode";
import { IResourceItem } from "./manager/IResourceItem";
import { ResourceActionEnum } from "./Resource";
import { ResourceEvent } from "./ResourceEvent";

export class IDResourceEvent extends ResourceEvent {
    public readonly id: string;
    constructor(context: IHttpContext, resource: IResourceNode, action: ResourceActionEnum, 
                event: string, id: string, data: IResourceItem<any>, path?: string) {
        super(context, resource, action, event, data, path);
        this.id = id;
    }
}