
import { NotFoundError } from "./GestaeError";
import { Part } from "./Part";
import { IRequestContext } from "./RequestContext";

export interface INamespaceOptions {};

/**
 * A namespace is used to group resources in a REST application.
 */
export class Namespace extends Part {

    public static readonly Events = {
        OnBeforeTraverse: "gestaejs.com/api/events/namespace/traverse/OnBefore",
        OnTraverse: "gestaejs.com/api/events/namespace/traverse/On",
        OnAfterTraverse: "gestaejs.com/api/events/namespace/traverse/OnAfter",
    };

    constructor(public readonly name: string, protected readonly options: INamespaceOptions = {}) {
        super(name);
    }

    async _do(context: IRequestContext): Promise<boolean> {
        console.log(`Did namespace ${this.name}.`);
        return true;
    }

    async _done(context: IRequestContext): Promise<void> {
        // A request cant stop on a namespace, only resources and thier actions.
        throw new NotFoundError(`Path ${context.request.uri.part} not found.`);
    }

    /**
     * Create a new namespace.
     * @param name The name of the namespace.
     */
    public static create(name:string, options: INamespaceOptions = {}): Namespace {
        return new Namespace(name, options);
    }
}
