import { Node } from "yallist";
import { IResourceNode } from "../IResourceNode";
import { IResourceItem, ResourceResolverType } from "./IResourceItem";
import { IResourceReader } from "./IResourceReader";

export class ResourceItem implements IResourceItem<any> {
    public           node?:      Node<IResourceItem<any>>;
    public           resources:  IResourceReader;
    public  readonly key:        string;
    public  readonly name:       string;
    private          _value:     {} | ResourceResolverType;

    constructor(key: IResourceNode, resources: IResourceReader, 
                value: {} | ResourceResolverType) {
        this.key       = key.fullyQualifiedPath;
        this.name      = key.name;
        this._value    = value;
        this.resources = resources;
    }

    get next(): IResourceItem<any> | undefined {
        if(this.node?.next)
            this.node = this.node.next;
        return this.node?.value;
    }

    get previous(): IResourceItem<any> | undefined {
        if(this.node?.prev)
            this.node = this.node.prev;
        return this.node?.value;
    }

    async getValue<T extends {}>(options: Record<string, any> = {}): Promise<T> {
        if(this._value instanceof Function)
            this._value = await this._value<T>(options);
        return this._value as T;
    }

    setValue<T extends {}>(value: T | ResourceResolverType): void {
        this._value = value;
    }
}