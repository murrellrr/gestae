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

import { GestaeObjectType } from "../../Gestae";
import { HttpContext } from "../../http/HttpContext";
import { ResourceActionEnum } from "./Resource";
import { 
    CreateResourceEvent, 
    ResourceEvent 
} from "./ResourceEvent";
import { AbstractResourceHandler } from "./AbstractResourceHandler";
import { IResourceItem } from "./manager/IResourceItem";

/**
 * @description
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class CreateResourceHandler extends AbstractResourceHandler {
    get action(): ResourceActionEnum {
        return ResourceActionEnum.Create;
    }

    async getData(context: HttpContext): Promise<GestaeObjectType> {
        return context.request.getBody<GestaeObjectType>();
    }

    createEvent(context: HttpContext, event: string, data: IResourceItem<any>): ResourceEvent {
        return new CreateResourceEvent(context, this.resource, event, data);
    }
}