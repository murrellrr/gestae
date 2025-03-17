import { HttpRequest } from "../../../http/HttpRequest";
import { SearchParams } from "../../../http/SearchParams";

/**
 * @description Resource search request.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchRequest {
    public readonly page:      number;
    public readonly pageSize:  number;
    public readonly filter:    SearchParams;

    constructor(page: number, pageSize: number, filter: SearchParams) {
        this.page     = page;
        this.pageSize = pageSize;
        this.filter   = filter;
    }

    static create(request: HttpRequest): SearchRequest {
        return new SearchRequest(request.searchParams.getNumber("page", 1)!, 
                                 request.searchParams.getNumber("pageSize", 10)!, 
                                 request.searchParams);
    }
}