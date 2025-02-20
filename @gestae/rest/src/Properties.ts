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
import { AbstractFactoryClass } from "./Gestae";

/**
 * Interface for managing properties.
 */
export interface IProperties {
    object(key:string, defaultValue?: any): Promise<any>;
    string(key:string, defaultValue?: string | null): Promise<string | null>;
    number(key:string, defaultValue?: number | null): Promise<number | null>;
    boolean(key:string, defaultValue?: boolean | null): Promise<boolean | null>;
    dateTime(key:string, defaultValue?: moment.Moment | null): Promise<moment.Moment | null>;
}

/**
 * Base class for creating properties. This is a chain of responsability pattern
 * design to stop at the first factory that resolves the property.
 * 
 * This is intedfned to ALWAYS check the local environment (process.env) fist so you can 
 * override other propertie systems when in local development mode. Allows you to fake things 
 * like and app configuration or key vault.
 */
export abstract class PropertyFactory {
    constructor(private _link: PropertyFactory | undefined = undefined) {}

    get link(): PropertyFactory | undefined {
        return this._link;
    }

    add(link: PropertyFactory): void {
        if(!this._link) this._link = link;
        else this._link.add(link);
    }

    abstract _get(key:string, defaultValue?: any): Promise<any>;

    async get(key:string, defaultValue?: any): Promise<any> {
        let _value = this._get(key, defaultValue);
        if(_value === undefined && this._link) return this._link.get(key, defaultValue);
        return _value;
    }
}

/**
 * Property factory for environment variables. This is the default factory. All other 
 * factories will come after this.
 */
export class EnvironmentPropertyFactory extends PropertyFactory {
    async _get(key: string): Promise<any> {
        return process.env[key];
    }
}

/**
 * Interface for managing properties.
 */
export interface IPropertyManager {
    addLink(factory: PropertyFactory): void;
}

/**
 * Class for managing properties.
 */
export class Properties implements IProperties, IPropertyManager {
    constructor(protected readonly factory: PropertyFactory) {}

    addLink(factory: PropertyFactory): void {
        this.factory.add(factory);
    }

    async get<T>(
        key: string,
        defaultValue: T | null,
        validator: (value: any) => boolean,
        transformer?: (value: any) => T
    ): Promise<T | null> {
        const _value = await this.factory.get(key);
        if(!validator(_value)) return defaultValue;
        return transformer ? transformer(_value) : _value;
    }

    async object(key: string, defaultValue?: any, reviver?: (this: any, key: string, value: any) => any): Promise<any> {
        return this.get(key, defaultValue, v => !!v, value => JSON.parse(value, reviver));
    }

    async string(key: string, defaultValue: string | null = null): Promise<string | null> {
        return this.get(key, defaultValue, v => typeof v === "string");
    }

    async number(key: string, defaultValue: number | null = null): Promise<number | null> {
        return this.get(key, defaultValue, v => typeof v === "number");
    }

    async boolean(key: string, defaultValue: boolean | null = null): Promise<boolean | null> {
        return this.get(key, defaultValue, v => typeof v === "boolean");
    }

    async dateTime(key: string, defaultValue: moment.Moment | null = null): Promise<moment.Moment | null> {
        return this.get(key, defaultValue, v => typeof v === "string" || moment.isMoment(v), moment);
    }
}

/**
 * Interface for ctontaining cached values.
 */
interface CachedValue<T> {
    value: T;
    expiresAt: moment.Moment | null; // null means it will never expire
    promise?: Promise<T | null>;
}

/**
 * Wrapper proxy for adding caching to the properties.
 */
export class CachedProperties {
    static wrapWithCache(properties: Properties, defaultCacheExpirySec: number = 300): Properties {
        // Inject caching storage into the original `Properties` instance
        const cache: Record<string, CachedValue<any>> = {};

        return new Proxy(properties, {
            get: (target: Properties, prop: keyof Properties) => {
                if(prop === "get" as keyof Properties) {
                    return async <T>(
                        key: string,
                        defaultValue: T | null,
                        validator: (value: any) => boolean,
                        transformer?: (value: any) => T,
                        cacheExpirySec: number = defaultCacheExpirySec // Expiry in seconds
                    ): Promise<T | null> => {
                        let cachedEntry = cache[key];

                        // If it's not there, create a cache entry
                        if(!cachedEntry) {
                            cachedEntry = {
                                value: null,
                                expiresAt: cacheExpirySec === 0 ? null : 
                                    moment().add(cacheExpirySec, "seconds"), // Never expires if `0`
                            };
                            cache[key] = cachedEntry; // Update reference
                        }

                        // If an async request is already in progress for this key, wait for it
                        if (cachedEntry.promise)
                            return await cachedEntry.promise;

                        // ⏳ If cache exists AND should not expire OR is still valid, return the cached value
                        if(cachedEntry.expiresAt === null || moment().isSameOrBefore(cachedEntry.expiresAt))
                            return cachedEntry.value;

                        // Define and immediately assign the in-flight request promise
                        cachedEntry.promise = (async () => {
                            const _value = await target.get<T>(key, defaultValue, validator, transformer);
                            if(_value !== null && _value !== undefined) {
                                cachedEntry.value = _value;
                                cachedEntry.expiresAt = cacheExpirySec === 0 ? null : 
                                    moment().add(cacheExpirySec, "seconds");
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

export class AbstractPropertyFactory extends AbstractFactoryClass {
    static create(options: Record<string, any> = {cached: true}): Properties {
        const _properties = new Properties(new EnvironmentPropertyFactory());
        return (options.cached)? CachedProperties.wrapWithCache(_properties) : _properties;
    }
}