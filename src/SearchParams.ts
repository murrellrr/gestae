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

import moment from "moment";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class SearchParams {
    [key: string]: any;

    private readonly params: Map<string, string> = new Map();

    constructor(url: URL) {
        this.params = new Map<string, string>();
        // set the query params
        url.searchParams.forEach((value, key) => {
            this.params.set(key, value);
            this[key] = value;
        });
    }

    contains(key: string): boolean {
        return this.params.has(key);   
    }

    get(key: string, defaultValue?: string): string | undefined {
        return this.params.get(key) ?? defaultValue;
    }

    getNumber(key: string, defaultValue?: number): number | undefined {
        const value = this.get(key);
        if(value)
            return parseInt(value);
        return defaultValue;
    }

    getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
        const value = this.get(key);
        if(value)
            return value === "true";
        return defaultValue;
    }

    getMoment(key: string, defaultValue?: moment.Moment): moment.Moment | undefined {
        const value = this.get(key);
        if(value)
            return moment(value);
        return defaultValue;
    }

    get hasParams(): boolean {
        return this.params.size > 0;
    }

    /**
     * Iterator for key/value pairs.
     */
    *[Symbol.iterator](): IterableIterator<[string, string]> {
        for (const entry of this.params.entries()) {
            yield entry;
        }
    }
}