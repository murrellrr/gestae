
/**
 * @description Resource Search result.
 * @abstract
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractSearchResult {
    constructor(
        public readonly id:    string,
        public readonly path?: string
    ) {}
}