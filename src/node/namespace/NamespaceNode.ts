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

import { GestaeClassType, getsertClassMetadata } from "../../Gestae";
import { createEventPathFromNode } from "../../events/GestaeEvent";
import { HttpContext } from "../../http/HttpContext";
import { NamespaceNodeFactory } from "./NamespaceNodeFactory";
import { AbstractTaskableNode } from "../task/AbstractTaskableNode";
import { 
    INamesapceNode, 
    INamespaceOptions 
} from "./INamesapceNode";
import { NAMESPACE_METADATA_KEY } from "./Namespace";
import { 
    NamespaceEvent, 
    NamespaceEvents 
} from "./NamespaceEvent";
import _ from "lodash";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NamespaceNode extends AbstractTaskableNode<INamespaceOptions> implements INamesapceNode {
    constructor(options: INamespaceOptions = {}, model?: GestaeClassType<any>) {
        super(model ?? Object, options);
        options.name = options.name ?? this.constructor.name.toLowerCase();
        options.traversable = options.traversable ?? true;
        options.$overloads = options.$overloads ?? true;
    }

    get type(): string {
        return "namespace";
    }

    public async beforeRequest(context: HttpContext): Promise<void> {
        const _event = new NamespaceEvent(context, this);
        _event.path = createEventPathFromNode(this, NamespaceEvents.Traverse.OnBefore);
        await this.emitEvent(context, _event);
    }

    public async afterRequest(context: HttpContext): Promise<void> {
        const _event = new NamespaceEvent(context, this);
        _event.path = createEventPathFromNode(this, NamespaceEvents.Traverse.OnAfter);
        await this.emitEvent(context, _event);
    }

    public static create(aClass: GestaeClassType<any> | string, options: INamespaceOptions = {}): NamespaceNode {
        if(typeof aClass === "string") {
            const _result = NamespaceNodeFactory.createFromString(aClass);
            return _result.bottom ?? _result.top;
        }
        else {
            let _options = getsertClassMetadata(aClass, NAMESPACE_METADATA_KEY, options);
            _options = _.merge(_options, options);
            return new NamespaceNode(getsertClassMetadata(aClass, NAMESPACE_METADATA_KEY, options));
        }
    }
}
