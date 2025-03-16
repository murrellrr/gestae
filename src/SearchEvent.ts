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
    createEventPathFromNode,
    EventRegisterType, 
    IEventOptions, 
    setEventMetadata 
} from "./GestaeEvent";
import { IHttpContext } from "./HttpContext";
import { HttpEvent } from "./HttpEvent";
import { INode } from "./Node";
import { 
    AbstractSearchResult,
    ISearchOptions,
    SearchRequest,
    SearchResponse
} from "./Search";

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
    on:     "on"    as string,  
    after:  "after" as string,
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

    constructor(context: IHttpContext, request: SearchRequest, response: SearchResponse<R>, 
                path?: string) {
        super(context, response, path);
        this.request = request;
    }
}

export const emitSearchEvent = async (source: INode, context: IHttpContext, event: EventRegisterType, request: SearchRequest, 
                                      response: SearchResponse<any>): Promise<SearchResponse<any>> => {
    const _event = new SearchEvent(context, request, response);
    _event.path = createEventPathFromNode(source, event);
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