
/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IListenerItem {
    event:           string | RegExp;
    method:          any;
    once:            boolean;
    useDataAsTarget: boolean;
}