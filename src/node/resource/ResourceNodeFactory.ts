import { 
    isClassConstructor, 
    hasClassMetadata, 
    GestaeClassType 
} from "../../Gestae";
import { 
    AbstractNodeFactoryChain, 
    FactoryReturnType 
} from "../AbstractNodeFactoryChain";
import { NodeTemplate } from "../NodeTemplate";
import { IResourceOptions, RESOURCE_METADATA_KEY } from "./Resource";
import { ResourceNode } from "./ResourceNode";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ResourceNodeFactory extends AbstractNodeFactoryChain<IResourceOptions, ResourceNode> {
    isNodeFactory(target: NodeTemplate): boolean {
        return isClassConstructor(target.node) && hasClassMetadata(target.node, RESOURCE_METADATA_KEY);
    }

    onCreate(target: NodeTemplate): FactoryReturnType<IResourceOptions, ResourceNode> {
        return {top: ResourceNode.create((target.node as GestaeClassType))};
    }
}