import { IResourceNode } from "../IResourceNode";
import { IResourceItem, ResourceResolverType } from "./IResourceItem";


/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceWriter {
    set<T extends {}>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T>;
    setValue<T extends {}>(key: IResourceNode, value: T | ResourceResolverType): IResourceItem<T>;
}