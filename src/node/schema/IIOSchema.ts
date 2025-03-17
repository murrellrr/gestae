import { SchemaObject } from "ajv";

/**
 * @description Input/Output Schema definitions
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IIOSchema {
    input?: SchemaObject;
    output: SchemaObject;
};