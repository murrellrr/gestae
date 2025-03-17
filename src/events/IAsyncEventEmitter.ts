import { GestaeEvent } from "./GestaeEvent";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IAsyncEventEmitter {
    emit<T>(event: GestaeEvent<T>, target?:object): Promise<void>;
    clear(): void;
}