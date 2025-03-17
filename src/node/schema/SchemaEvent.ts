import { SchemaObject } from "ajv";
import { HttpEvent } from "../../http/HttpEvent";
import { IHttpContext } from "../../http/IHttpContext";


/**
 * @description Event for payload validations.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SchemaEvent<T> extends HttpEvent<T> {
    public readonly schema?: SchemaObject;
    public readonly results?: any;

    constructor(context: IHttpContext, data: T, schema?: SchemaObject) {
        super(context, data);
        this.schema = schema;
    }
}