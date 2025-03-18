import { IHttpContext } from "../../http/IHttpContext";
import { IDResourceEvent } from "./IDResourceEvent";
import { IResourceNode } from "./IResourceNode";
import { IResourceItem } from "./manager/IResourceItem";
import { ResourceActionEnum } from "./Resource";


export class ReadResourceEvent extends IDResourceEvent {
    constructor(context: IHttpContext, resource: IResourceNode, event: string,  
                id: string, data: IResourceItem<any>) {
        super(context, resource, ResourceActionEnum.Read, event, id, data);
    }
}