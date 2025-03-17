import { AbstractSearchResult } from "./AbstractSearchResult";

/**
 * @description Resource search response.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchResponse<R extends AbstractSearchResult> {
    protected _data:    R[]    = [];
    protected _count:   number = 0;
    public    total:    number = 0;
    public    page:     number = 0;
    public    pageSize: number = 0;

    constructor(data: R[] = [], page?: number, pageSize?: number, total?: number) {
        this._data    = data;
        this._count   = data.length;
        this.total    = total    ?? this._count;
        this.page     = page     ?? 0;
        this.pageSize = pageSize ?? this._count;
    }

    get count(): number {
        return this._count;
    }

    get data(): R[] {
        return this._data;
    }

    set data(data: R[]) {
        this._data = data;
        this._count = data.length;
        // Check the totals too
    }

    add(result: R) {
        this._data.push(result);
        this._count = this._data.length;
    }

    /**
     * @description Properly formats the encapsulated data to a public structure.
     * @returns Public JSON object.
     */
    toJSON(): any {
        return {
            data:     this._data,
            total:    this.total,
            page:     this.page,
            pageSize: this.pageSize,
            count:    this._count
        };
    }

    *[Symbol.iterator](): Iterator<R> {
        for (const item of this._data) {
            yield item;
        }
    }
}