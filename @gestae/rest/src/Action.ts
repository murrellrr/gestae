import { Part } from "./Part";
import { IRequestContext } from "./RequestContext";

export enum ActionEvents {
    OnExecute = "gestaejs.com/api/events/action/execute/On",
};

export interface IActionOptions {
    name?: string;
    validate?: boolean;
    useSchemaAsDefaults?: boolean;
    schema?: object;
    asynchronous?: boolean;
};

export class Action extends Part {
    private readonly options: IActionOptions;

    constructor(name?: string, options: Partial<IActionOptions> = {}) {
        super(name ?? options.name ?? new.target.name);
        this.options = options;

        // set up the core defaults:
        this.options.validate = this.options.validate ?? false;
        this.options.schema = this.options.schema ?? {};
        this.options.useSchemaAsDefaults = this.options.useSchemaAsDefaults ?? false;
        this.options.asynchronous = this.options.asynchronous ?? false;
    }

    get validate(): boolean {
        return this.options.validate ?? false;
    }

    get useSchemaAsDefaults(): boolean {
        return this.options.useSchemaAsDefaults ?? false;
    }

    get schema(): object {
        return this.options.schema ?? {};
    }

    get asynchronous(): boolean {
        return this.options.asynchronous ?? false;
    }

    _do(context: IRequestContext): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    public static create(name: string, options: Partial<IActionOptions> = {}): Action { 
        return new Action(name, options);
    }
}