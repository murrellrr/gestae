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
    IPropertyOptions, 
    Properties 
} from "./Properties";
import { ICachedValue } from "./ICachedValue";
import moment from "moment";

/**
 * @description Wrapper proxy for adding caching to the properties.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class CachedProperties {
    static wrapWithCache(properties: Properties, options: IPropertyOptions): Properties {
        // Inject caching storage into the original `Properties` instance
        const cache: Record<string, ICachedValue<any>> = {};

        options.cacheExpirySec = options.cacheExpirySec ?? 300; // Default to 5 minutes

        return new Proxy(properties, {
            get: (target: Properties, prop: keyof Properties) => {
                if(prop === "get" as keyof Properties) {
                    return async <T>(key: string, defaultValue: T | undefined, validator: (value: any) => boolean,
                                     transformer?: (value: any) => T): Promise<T | null> => {
                        let cachedEntry = cache[key];

                        // If it's not there, create a cache entry
                        if(!cachedEntry) {
                            cachedEntry = {
                                value: null,
                                expiresAt: options.cacheExpirySec === 0 ? null : 
                                    moment().add(options.cacheExpirySec, "seconds"), // Never expires if `0`
                            };
                            cache[key] = cachedEntry; // Update reference
                        }

                        // If an async request is already in progress for this key, wait for it
                        if(cachedEntry.promise) return await cachedEntry.promise;

                        // ⏳ If cache exists AND should not expire OR is still valid, return the cached value
                        if(cachedEntry.expiresAt === null || moment().isSameOrBefore(cachedEntry.expiresAt))
                            return cachedEntry.value;

                        // Define and immediately assign the in-flight request promise
                        cachedEntry.promise = (async () => {
                            const _value = await target.get<T>(key, defaultValue, validator, transformer);
                            if(_value !== null && _value !== undefined) {
                                cachedEntry.value = _value;
                                cachedEntry.expiresAt = options.cacheExpirySec === 0 ? null : 
                                    moment().add(options.cacheExpirySec, "seconds");
                            }
                            return _value;
                        })();

                        try {
                            return await cachedEntry.promise;
                        } 
                        finally {
                            // Cleanup in-flight promise once resolved
                            delete cachedEntry.promise;
                        }
                    };
                }
                return target[prop];
            },
        });
    }
}