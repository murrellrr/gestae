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

import { ILogger, ILoggerOptions } from "./ILogger";
import pino from "pino";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class DefaultLogger implements ILogger {
    private static instance: DefaultLogger; // Singleton instance

    private readonly logger: pino.Logger;

    constructor(base: pino.Logger) {
        this.logger = base;
    }

    /**
     * Get the global instance of the logger.
     */
    public static getInstance(options: ILoggerOptions): DefaultLogger {
        if(!DefaultLogger.instance) {
            DefaultLogger.instance = new DefaultLogger(pino({
                level: options.level ?? "debug",
                transport: {
                    target: options.target ?? "pino-pretty",
                },
                base: {
                    ...(options ?? {}), // Merge provided base object
                    name: options.name, // Override `name` if provided
                }
            }));
        }
        return DefaultLogger.instance;
    }

    log(message: string, ...optionalParams: any[]): void {
        this.logger.info(message, ...optionalParams);
    }

    info(message: string, ...optionalParams: any[]): void {
        this.logger.info(message, ...optionalParams);
    }

    warn(message: string, ...optionalParams: any[]): void {
        this.logger.warn(message, ...optionalParams);
    }

    error(message: string, ...optionalParams: any[]): void {
        this.logger.error(message, ...optionalParams);
    }

    debug(message: string, ...optionalParams: any[]): void {
        this.logger.debug(message, ...optionalParams);
    }

    bindings(): Record<string, any> {
        return this.logger.bindings();
    }

    get level(): string {
        return this.logger.level;
    }

    flush(): void {
        this.logger.flush();
    }

    /**
     * Creates a child logger, appending its name to the hierarchical logger string.
     */
    child(options: Record<string, any> = {name: "app"}): ILogger {
        const _child = this.logger.child(options);
        return new DefaultLogger(_child);
    }

    clone(options: Record<string, any> = {}): ILogger {
        return this.child({ ...this.bindings(), ...options });
    }

    static create(options: ILoggerOptions = {name: "app"}): ILogger {
        return DefaultLogger.getInstance(options);
    }
}

/**
 * @description Minimal console logger for use in modules or functions outside the 
 *              scope of an application.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const GestaeLogger = DefaultLogger.create({name: "Gestae"});