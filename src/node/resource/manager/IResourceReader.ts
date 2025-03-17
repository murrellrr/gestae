import { IResourceNode } from "../IResourceNode";
import { IResourceItem } from "./IResourceItem";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceReader {
    contains(key: IResourceNode): boolean;
    get current(): IResourceItem<any> | undefined;
    get<T extends {}>(key: IResourceNode): IResourceItem<T>;
    getValue<T extends {}>(key: IResourceNode, options?: Record<string, any>): Promise<T>
    [Symbol.iterator](): IterableIterator<IResourceItem<any>>;
}