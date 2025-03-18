import { IHttpContext } from "../../http/IHttpContext";
import { IResourceNode } from "./IResourceNode";
import { IResourceItem } from "./manager/IResourceItem";
import { ResourceActionEnum } from "./Resource";
import { ResourceEvent } from "./ResourceEvent";


export class CreateResourceEvent extends ResourceEvent {
    constructor(context: IHttpContext, resource: IResourceNode, event: string, 
                data: IResourceItem<any>, path?: string) {
        super(context, resource, ResourceActionEnum.Create, event, data, path);
    }
}