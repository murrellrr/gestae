import { EventRegister, GestaeHttpEvent } from "./GestaeEvent";
import { NotFoundError } from "./GestaeError";
import { Part, ModelType, PartOptions } from "./Part";
import { IHttpContext } from "./HttpContext";

export interface NamespaceOptions extends PartOptions {
    //
};

/**
 * A namespace is used to group resources in a REST application.
 */
export class Namespace extends Part {
    static readonly Events: Record<string, EventRegister>  = {
        OnBeforeTraverse: {operation: "traverse", event: "before"},
        OnTraverse:       {operation: "traverse", event: "on"},
        OnAfterTraverse:  {operation: "traverse", event: "after"}
    };

    private readonly _options: NamespaceOptions;

    constructor(_ModelClass: ModelType, options: NamespaceOptions = {}) {
        super(_ModelClass, options);
        this._options = options;
    }

    protected get type(): string {
        return "namespace";
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        // Fire the read events no matter what.
        let _target = this.createModelInstance(this._name);
        let _event = GestaeHttpEvent.createHttpEventNoPath(context, _target);
        return this.emitLifecycle(_event, Namespace.Events.OnTraverse.operation, _target);
    }

    protected async _done(context: IHttpContext): Promise<void> {
        // A request cant stop on a namespace, only resources and thier actions.
        context.logger.error(`Namespace '${this.model.id}' cannot be the last part of the path.`);
        throw new NotFoundError(`Path ${context.request.uri.part} not found.`);
    }

    /**
     * Create a new namespace.
     * @param name The name of the namespace.
     */
    public static create(_ModelCalss: ModelType, options: NamespaceOptions = {}): Namespace {
        return new Namespace(_ModelCalss, options);
    }
}
