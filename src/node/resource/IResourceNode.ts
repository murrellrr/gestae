import { GestaeObjectType } from "../../Gestae";
import { IHttpContext } from "../../http/IHttpContext";
import { INode } from "../INode";
import { IResourceItem } from "./manager/IResourceItem";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceNode extends INode {
    get resourceKey(): string;
    getResource<T extends {}>(context: IHttpContext): IResourceItem<T>;
    getResourceValue<T extends {}>(context: IHttpContext, options?: Record<string, any>): Promise<T>;
    getInstance(... args: any[]): GestaeObjectType;
}