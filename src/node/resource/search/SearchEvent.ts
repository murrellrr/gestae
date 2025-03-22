/*
 *  Copyright (c) 2024, KRI, LLC.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { 
    createEventPathFromRegister,
    EventRegisterType, 
    IEventOptions, 
    setEventMetadata 
} from "../../../events/GestaeEvent";
import { IHttpContext } from "../../../http/IHttpContext";
import { HttpEvent } from "../../../http/HttpEvent";
import { ISearchOptions } from "./Search";
import { AbstractSearchResult } from "./AbstractSearchResult";
import { SearchRequest } from "./SearchRequest";
import { SearchResponse } from "./SearchResponse";
import { IResourceNode } from "../IResourceNode";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ISearchEventOptions extends IEventOptions {
    searchOptions?: ISearchOptions;
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const SearchEvents = {
    before: "before" as string,
    on:     "on"     as string,  
    after:  "after"  as string,
    Search: {
        operation: "search",
        OnBefore: {operation: "search", action: "before"} as EventRegisterType,
        On:       {operation: "search", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "search", action: "after" } as EventRegisterType,
    },
    MediaSearch: {
        operation: "mediasearch",
        OnBefore: {operation: "mediasearch", action: "before"} as EventRegisterType,
        On:       {operation: "mediasearch", action: "on"    } as EventRegisterType,
        OnAfter:  {operation: "mediasearch", action: "after" } as EventRegisterType,
    }
};


export class SearchEvent<R extends AbstractSearchResult> extends HttpEvent<SearchResponse<R>> {
    public readonly request:  SearchRequest;
    public readonly resource: IResourceNode;

    constructor(context: IHttpContext, resource: IResourceNode, request: SearchRequest, response: SearchResponse<R>, 
                path?: string) {
        super(context, response, path);
        this.resource = resource;
        this.request  = request;
    }
}

export const emitSearchEvent = async (source: IResourceNode, context: IHttpContext,
                                      event: EventRegisterType, request: SearchRequest, 
                                      response: SearchResponse<any>): Promise<SearchResponse<any>> => {
    const _path  = `gestaejs:resource.search:${source.uri}:${createEventPathFromRegister(event)}`;
    const _event = new SearchEvent(context, source, request, response, _path);
    await context.applicationContext.eventEmitter.emit(_event);
    return _event.data;
};

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const OnSearchResource = (event: EventRegisterType, options: ISearchEventOptions = {}) => {
    return function <T extends Object>(target: T, property: string, 
                                       descriptor: TypedPropertyDescriptor<(event: SearchEvent<any>) => Promise<void>>) {
        options.dataAsTarget = options.dataAsTarget ?? false;
        setEventMetadata(target, event, property, options);
    };
}