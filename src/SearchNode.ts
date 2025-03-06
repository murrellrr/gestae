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

import { InitializationContext } from "./ApplicationContext";
import { 
    hasMetadata, 
    getsertMetadata 
} from "./Gestae";
import { GestaeError } from "./GestaeError";
import { HttpContext } from "./HttpContext";
import { AbstractNode } from "./Node";
import { 
    ISearchOptions, 
    SEARCH_OPTION_KEY 
} from "./Search";
import { ITaskOptions } from "./TaskEvent";
import { AbstractTaskableNode } from "./TaskNode";

const DEFAULT_SEARCH_NAME = "search";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchNode extends AbstractNode<ISearchOptions> {
    constructor(options: ISearchOptions = {}) {
        super(options);
    }

    get type(): string {
        return "search";
    }

    getInstance<T extends Object>(): T {
        return this.parent!.getInstance(); // We will always have a parent.
    }

    /**
     * @description no more processessing or children after a search.
     * @override
     */
    get endpoint(): boolean {
        return true;
    }

    /**
     * 
     * @param child 
     * @override
     */
    add(child: AbstractNode<any>): AbstractNode<any> {
        throw GestaeError.toError("Tasks do not supoport child nodes.");
    }

    protected async _beforeInitialize(context: InitializationContext): Promise<void> {
        // defensive coding.
        if(!this.parent)
            throw GestaeError.toError("SearchNode must have a parent."); // ensure we have a parent
    }

    protected async _beforeDoRequest(context: HttpContext): Promise<void> {
        //
    }

    protected async _doRequest(context: HttpContext): Promise<void> {
        context.response.send({
            message: "search worked."
        });
    }

    protected async _afterDoRequest(context: HttpContext): Promise<void> {
        //
    }

    // protected async emitResourceEvent(context: HttpContext, event: SearchEvent<any>, type: EventRegisterType): Promise<void> {
    //     event.data = context.resources.getResource(this.resourceKey);
    //     event.path = `${this.fullyQualifiedPath}:${formatEvent(type)}`;
    //     context.log.debug(`Emitting event '${event.path}'.`);
    //     await this.emitEvent(context, event);
    //     context.resources.setResource(this.resourceKey, event.data);
    // }
}

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export abstract class AbstractSearchableNode<T extends ITaskOptions> extends AbstractTaskableNode<T> {
    private searchNodeName: string = DEFAULT_SEARCH_NAME;

    /**
     * @description
     * @param context 
     */
    protected async _beforeInitialize(context: InitializationContext): Promise<void> {
        await super._beforeInitialize(context);
        const _target = this.getInstance();
        if(hasMetadata(_target, SEARCH_OPTION_KEY)) {
             context.log.debug(`'${_target.constructor.name}' is decorated with @On<async>SearchResource, applying search node to '${this.name}'.`);
             const _config = getsertMetadata(_target, SEARCH_OPTION_KEY);
             context.log.debug(`Creating search node...`);
             _config.name = _config.name ?? DEFAULT_SEARCH_NAME;
             this.searchNodeName = _config.name;
             const _search = new SearchNode(_config);
             this.add(_search);
             context.log.debug(`Search node applied.`);
        }
    }

    protected async _beforeDoRequest(context: HttpContext): Promise<void> {
        context.log.debug(`Checking to see if '${this.name}' is a search request.`);
        if(context.request.uri.hasNext && context.request.uri.peek === this.searchNodeName)
            context.leap(this.uri);
        else 
            return super._beforeDoRequest(context);
    }
}