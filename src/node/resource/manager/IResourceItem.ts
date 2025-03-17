import { IResourceReader } from "./IResourceReader";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export type ResourceResolverType = <T = {}>(options?: Record<string, any>) => Promise<T>;

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IResourceItem<T = {}> {
    get name(): string;
    get key(): string;
    get resources(): IResourceReader;
    get next(): IResourceItem<T> | undefined;
    get previous(): IResourceItem<T> | undefined;
    getValue<T extends {}>(options?: Record<string, any>): Promise<T>;
    setValue<T extends {}>(value: T | ResourceResolverType): void;
};