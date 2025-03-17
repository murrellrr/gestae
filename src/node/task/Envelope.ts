import { GestaeObjectType } from "../../Gestae";


/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class Envelope<I extends GestaeObjectType, O extends GestaeObjectType> {
    public input:   I;
    public output?: O;

    constructor(input: I, output?: O) {
        this.input  = input;
        this.output = output;
    }
}