import { Part } from "./Part";

export class Action extends Part {
    public static readonly Events = {
        OnExecute: "gestaejs.com/api/events/action/execute/On",
    };

    constructor(name: string) {
        super(name);
    }

    public static create(name: string): Action { 
        return new Action(name);
    }
}