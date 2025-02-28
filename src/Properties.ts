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

export interface IPropertyOptions {
    cache?: boolean;
    cacheExpirySec?: number;
}
    

/**
 * Interface for managing properties.
 */
export interface IProperties {
    object(key:string, defaultValue?: any): Promise<any>;
    string(key:string, defaultValue?: string | undefined): Promise<string | undefined>;
    number(key:string, defaultValue?: number | undefined): Promise<number | undefined>;
    boolean(key:string, defaultValue?: boolean | undefined): Promise<boolean | undefined>;
    dateTime(key:string, defaultValue?: moment.Moment | undefined): Promise<moment.Moment | undefined>;
}

/**
 * Base class for creating properties. This is a chain of responsability pattern
 * design to stop at the first factory that resolves the property.
 * 
 * This is intedfned to ALWAYS check the local environment (process.env) fist so you can 
 * override other propertie systems when in local development mode. Allows you to fake things 
 * like and app configuration or key vault.
 */
export abstract class PropertyFactory<T> {
    constructor(private _link: PropertyFactory<any> | undefined = undefined) {}

    get link(): PropertyFactory<any> | undefined {
        return this._link;
    }

    add(link: PropertyFactory<any>): void {
        if(!this._link) this._link = link;
        else this._link.add(link);
    }

    abstract _get(key:string, defaultValue?: T): Promise<T>;

    async get(key:string, defaultValue?: T): Promise<T> {
        let _value = this._get(key, defaultValue);
        if(_value === undefined && this._link) return this._link.get(key, defaultValue);
        return _value;
    }
}

/**
 * @description Property factory for environment variables. This is the default factory.
 *              All other factories will come after this one on the chain.
 */
export class EnvironmentPropertyFactory extends PropertyFactory<string | undefined> {
    async _get(key: string): Promise<string | undefined> {
        return process.env[key];
    }
}

/**
 * Interface for managing properties.
 */
export interface IPropertyManager {
    addLink(factory: PropertyFactory<any>): void;
}

/**
 * Class for managing properties.
 */
export class Properties implements IProperties, IPropertyManager {
    constructor(protected readonly factory: PropertyFactory<any>) {}

    addLink(factory: PropertyFactory<any>): void {
        this.factory.add(factory);
    }

    /**
     * @description Get a property value from its origin. If the key is not found, it will return the defaultValue.
     * If the value is not valid, it will return the defaultValue.
     * @param key          The key of the property to get.
     * @param defaultValue The default value to return if the key is not found or the value is not valid.
     * @param validator    A function to validate the value. If the value is not valid, it will return the defaultValue.
     * @param transformer  A function to transform the value. If the value is not valid, it will return the defaultValue.
     * @returns The poroperty value from its origin, the defaultValue if key was not found, or null.
     */
    async get<T>(key: string, defaultValue: T | undefined, validator?: (value: any) => boolean,
                 transformer?: (value: any) => T): Promise<T | undefined> {
        let _value = await this.factory.get(key);
        if(validator && !validator(_value)) return defaultValue;
        if(validator) _value = validator(_value) ? _value : defaultValue;
        return transformer ? transformer(_value) : _value;
    }

    async object<T>(key: string, defaultValue?: T, reviver?: (this: T, key: string, value: any) => T): Promise<T> {
        return this.get(key, defaultValue, undefined, value => JSON.parse(value, reviver));
    }

    async string(key: string, defaultValue?: string): Promise<string | undefined> {
        return this.get(key, defaultValue);
    }

    async number(key: string, defaultValue?: number): Promise<number | undefined> {
        return this.get(key, defaultValue, undefined, (value) => Number(value));
    }

    async boolean(key: string, defaultValue?: boolean): Promise<boolean | undefined> {
        return this.get(key, defaultValue,undefined, (value) => Boolean(value));
    }

    async dateTime(key: string, defaultValue?: moment.Moment): Promise<moment.Moment | undefined> {
        return this.get(key, defaultValue, undefined, (value) => moment(value));
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
    static wrapWithCache(properties: Properties, options: IPropertyOptions): Properties {
        // Inject caching storage into the original `Properties` instance
        const cache: Record<string, CachedValue<any>> = {};

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

export class BaseProperties extends Properties {
    constructor() {
        super(new EnvironmentPropertyFactory());
    }

    static create(options: IPropertyOptions = {}): Properties {
        options.cache = options.cache ?? false;

        if(options.cache)
            return CachedProperties.wrapWithCache(new BaseProperties(), options);
        return new BaseProperties();
    }
}