import { IApplicationContext } from "../app/IApplicationContext";
import { GestaeEvent } from "./GestaeEvent";


/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ApplicationEvent<T = {}> extends GestaeEvent<T> {
    public readonly context: IApplicationContext;

    constructor(context: IApplicationContext, data: T, path?: string) {
        super(data, path);
        this.context = context;
    }
}