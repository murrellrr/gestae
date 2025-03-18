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
    hasClassMetadata, 
    getsertClassMetadata 
} from "../Gestae";
import { GestaeError } from "../error/GestaeError";
import { AbstractFeatureFactoryChain } from "../node/AbstractFeatureFactoryChain";
import { AbstractNode } from "../node/AbstractNode";
import { 
    createEventPathFromNode, 
    EVENT_OPTIONS_KEY, 
    GestaeEvent 
} from "./GestaeEvent";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class EventFeatureFactory extends AbstractFeatureFactoryChain<AbstractNode<any>> {
    isFeatureFactory(node: AbstractNode<any>): boolean {
        return hasClassMetadata(node.model, EVENT_OPTIONS_KEY);
    }

    onApply(node: AbstractNode<any>): void {
        const _metadata = getsertClassMetadata(node.model, EVENT_OPTIONS_KEY);
        for(const _key in _metadata) {
            const _eventsMetadata = _metadata[_key];
            for(const _eventMetadata of _eventsMetadata) {
                const _fullyQualifiedEventPath = `${createEventPathFromNode(node, _eventMetadata.register)}`;
                const _method = node.model.prototype[_eventMetadata.register.method] as (event: GestaeEvent) => void | Promise<void>;

                // Check Method.
                if(!_method) 
                    throw GestaeError.toError(`Method '${node.model.name}.${_eventMetadata.register.method}' not implemented.'`);

                this.context.eventQueue.on(_fullyQualifiedEventPath, 
                                            _method, 
                                            _eventMetadata.once);
                this.log.debug(`Binding method '${node.model.name}.${_eventMetadata.register.method}' on action '${_eventMetadata.register.action}' to event '${_fullyQualifiedEventPath}' for node '${node.name}'.`);
            }
        }
    }
}