import { IHttpContext } from "../../http/IHttpContext";
import { IDResourceEvent } from "./IDResourceEvent";
import { IResourceNode } from "./IResourceNode";
import { IResourceItem } from "./manager/IResourceItem";
import { ResourceActionEnum } from "./Resource";


export class UpdateResourceEvent extends IDResourceEvent {
    public readonly patch: boolean;
    constructor(context: IHttpContext, resource: IResourceNode, event: string,  
                id: string, data: IResourceItem<any>, patch: boolean = false) {
        super(context, resource, ResourceActionEnum.Update, event, id, data);
        this.patch = patch;
    }
}