import { hasClassMetadata } from "../../Gestae";
import { AbstractFeatureFactoryChain } from "../AbstractFeatureFactoryChain";
import { AbstractNode } from "../AbstractNode";
import { SCHEMA_METADATA_KEY } from "./Schema";


/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SchemaFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory(node: AbstractNode<any>): boolean {
        return hasClassMetadata(node.model, SCHEMA_METADATA_KEY);
    }

    onApply(node: AbstractNode<any>): void {
        //deleteMetadata(node.model, SCHEMA_OPTION_KEY);
    }
}