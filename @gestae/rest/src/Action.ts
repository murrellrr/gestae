import { Part } from "./Part";
import { IHttpContext } from "./HttpContext";
import { NotImplementedError } from "./GestaeError";
import { DefaultModel, Model } from "./Model";

export enum ActionEvents {
    OnExecute = "gestaejs.com/api/events/action/execute/On",
};

export interface ActionOptions {
    validate?: boolean;
    useSchemaAsDefaults?: boolean;
    schema?: object;
    asynchronous?: boolean;
}


export class Action extends Part {
    private readonly _options: ActionOptions;

    constructor(model: Model, options: ActionOptions = {}) {
        super(model);
        this._options = options;
    }

    get type(): string {
        return "action";
    }

    protected async _doRequest(context: IHttpContext): Promise<void> {
        throw new NotImplementedError();
    }

    public static create(model: Model | string, options: ActionOptions = {}): Action { 
        if(typeof model === "string") model = new DefaultModel(model);
        return new Action(model, options);
    }
}