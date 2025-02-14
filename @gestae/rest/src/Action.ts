import { Part, ModelType, PartOptions } from "./Part";
import { IHttpContext } from "./HttpContext";
import { NotImplementedError } from "./GestaeError";

export enum ActionEvents {
    OnExecute = "gestaejs.com/api/events/action/execute/On",
};

export interface ActionOptions extends PartOptions {
    validate?: boolean;
    useSchemaAsDefaults?: boolean;
    schema?: object;
    asynchronous?: boolean;
}

export class Action extends Part {
    private readonly _options: ActionOptions;

    constructor(model: ModelType, options: ActionOptions = {}) {
        super(model, options);
        this._options = options;
    }

    get type(): string {
        return "action";
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        throw new NotImplementedError();
    }

    public static create(model: ModelType, options: ActionOptions = {}): Action { 
        return new Action(model, options);
    }
}