import { HttpRequestEvent } from "./GestaeEvent";
import { NotFoundError } from "./GestaeError";
import { Part } from "./Part";
import { IRequestContext } from "./RequestContext";

export enum NamespaceEvents {
    OnBeforeTraverse = "OnBefore",
    OnTraverse = "On",
    OnAfterTraverse = "OnAfter",
};

export interface INamespaceOptions {
    name?: string;
};

export class TraverseEvent extends HttpRequestEvent<Namespace> {
    constructor(context: IRequestContext,namespace: Namespace) {
        super("traverse", context, namespace);
    }
}

/**
 * A namespace is used to group resources in a REST application.
 */
export class Namespace extends Part {
    protected readonly options: INamespaceOptions;

    constructor(name?:string, options: Partial<INamespaceOptions> = {}) {
        super(name ?? options.name ?? new.target.name);
        this.options = options;
    }

    async _do(context: IRequestContext): Promise<boolean> {
        context.logger.debug(`Processing Namespace '${this.name}'.`);



        return true;
    }

    async _done(context: IRequestContext): Promise<void> {
        // A request cant stop on a namespace, only resources and thier actions.
        context.logger.error(`Namespace '${this.name}' cannot be the last part of the path.`);
        throw new NotFoundError(`Path ${context.request.uri.part} not found.`);
    }

    /**
     * Create a new namespace.
     * @param name The name of the namespace.
     */
    public static create(name:string, options: Partial<INamespaceOptions> = {}): Namespace {
        return new Namespace(name, options);
    }
}
