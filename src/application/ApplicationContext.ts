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

import { IAsyncEventEmitter } from "../events/IAsyncEventEmitter";
import { AsyncEventEmitter } from "../events/AsyncEventEmitter";
import { IAsyncEventQueue } from "../events/IAsyncEventQueue";
import { AbstractContext, } from "../context/AbstractContext";
import { ILogger } from "../log/ILogger";
import { IProperties } from "../properties/IProperties";
import { IApplicationContext } from "./IApplicationContext";
import { IPluginManager } from "../plugins/IPluginManager";
import { PluginManager } from "../plugins/PluginManager";
import { IApplication } from "./IApplication";

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface IApplicationContextOptions {
    //
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ApplicationContext extends AbstractContext implements IApplicationContext {
    public  readonly application:   IApplication;
    public  readonly pluginManager: PluginManager;
    private readonly events:        AsyncEventEmitter;
    
    constructor(application: IApplication) {
        super();
        this.application   = application;
        this.events        = new AsyncEventEmitter(application.log); 
        this.pluginManager = new PluginManager(application.log);
    }

    get log(): ILogger {
        return this.application.log;
    }

    get properties(): IProperties {
        return this.application.properties;
    }

    get eventEmitter(): IAsyncEventEmitter {
        return this.events;
    }

    get eventQueue(): IAsyncEventQueue {
        return this.events;
    }

    get plugins(): IPluginManager {
        return this.pluginManager;
    }

    static create(application: IApplication) {
        return new ApplicationContext(application);
    }
}