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

import { PassThrough } from "stream";
import { RequestEntityTooLargeError } from "./GestaeError";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class HttpPassThrough {
    public readonly pipe:    PassThrough;
    public readonly sizeB:   number;
    
    constructor(sizeB: number, pipe?: PassThrough) {
        this.pipe  = pipe ?? new PassThrough();
        this.sizeB = sizeB;
    }

    addSizeLimitter(): this {
        let _this        = this;
        let _totalLength = 0;
        // Monitor the incomming request to ensure it doesnt exceed the max size.
        this.pipe.on("data", (chunk: Buffer | string) => {
            // Determine the byte length of the chunk
            const chunkSize = typeof chunk === "string" ? Buffer.byteLength(chunk, "utf8") : chunk.length;
            _totalLength += chunkSize;
            if(_totalLength > _this.sizeB)
                _this.pipe.destroy(new RequestEntityTooLargeError(_this.sizeB));
        });
        return this;
    }
}