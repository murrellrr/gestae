import { EventRegister, GestaeHttpEvent } from "./GestaeEvent";
import { NotFoundError } from "./GestaeError";
import { Part } from "./Part";
import { IHttpContext } from "./HttpContext";
import { DefaultModel, Model } from "./Model";

export interface NamespaceOptions {
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

    constructor(model: Model, options: NamespaceOptions = {}) {
        super(model);
        this._options = options;
    }

    protected get type(): string {
        return "namespace";
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        let _event = GestaeHttpEvent.createHttpEvent(
            GestaeHttpEvent.createEventURI(this._path, Namespace.Events.OnBeforeTraverse), 
            context, this);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Namespace.Events.OnTraverse);
        await context.applicationContext.events.emit(_event);
        _event.path = GestaeHttpEvent.createEventURI(this._path, Namespace.Events.OnAfterTraverse);
        await context.applicationContext.events.emit(_event);
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
    public static create(model: Model | string, options: NamespaceOptions = {}): Namespace {
        if(typeof model === "string") model = new DefaultModel(model);
        return new Namespace(model, options);
    }
}
