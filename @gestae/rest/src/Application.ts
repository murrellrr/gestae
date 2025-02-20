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

import http from 'http';

export const VERSION = "1.0.0";

/**
 * @description Options for the application runtime.
 */
export interface IApplicationOptions {
    name?: string;
    root?: string;
    port?: number;
};

export interface IApplication {
    start(port?: number): Promise<IApplication>;
}

class Application implements IApplication {
    private _server: http.Server | undefined;
    public readonly options: IApplicationOptions;
    
    constructor(options: IApplicationOptions = {}) {
        this.options = options;
        this.options.name = this.options?.name ?? "My Application";
        this.options.root = this.options?.root ?? "/";
        this.options.port = this.options?.port ?? 3000;
    }

    add<T>(child: T): void {
        //
    }

    /**
     * Detects if an HTTP request was made over SSL/TLS (HTTPS).
     * Supports both direct HTTPS connections and reverse proxy headers.
     * 
     * @param req - The IncomingMessage (HTTP request).
     * @returns `true` if the request was over HTTPS, `false` otherwise.
     */
    protected _isSecureRequest(req: http.IncomingMessage): boolean {
        // Direct HTTPS connection (native TLS)
        if(req.socket && (req.socket as any).encrypted) return true;

        // Behind a reverse proxy (e.g., Nginx, AWS ALB)
        const forwardedProto = req.headers["x-forwarded-proto"];
        if(typeof forwardedProto === "string" && forwardedProto.toLowerCase() === "https")
            return true;

        return false;
    }

    protected async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        //
    }

    protected _handleError(req: http.IncomingMessage, res: http.ServerResponse, error: any): void {
        //
        res.writeHead(error.code, error.message, {"Content-Type": "application/json"});
        res.write(JSON.stringify(error.safe(), null, 2));
    }

    protected async _startServer(): Promise<void> {
        let _this = this;
        // start up the server
        _this._server = http.createServer((req, res) => {
            _this._handleRequest(req, res)
                .then(() => {
                    // do nothing
                })
                .catch((error:any) => {
                    _this._handleError(req, res, error);
                })
                .finally(() => {
                    res.end();
                });
        });
        _this._server.listen(this.options.port);
    }

    protected async _start() {
        //await this._root.initialize(this.context); // Initialize ALL the Parts throughout the hierarchy.
        await this._startServer();
    }

    async start(port?: number): Promise<IApplication> {
        console.log("   ________                 __              /\\  _____________________ ____________________ ");
        console.log("  /  _____/  ____   _______/  |______    ___\\ \\ \\______   \\_   _____//   _____/\\__    ___/ ");
        console.log(" /   \\  ____/ __ \\ /  ___/\\   __\\__  \\ _/ __ \\ \\ |       _/|    __)_ \\_____  \\   |    |    ");
        console.log(" \\    \\_\\  \\  ___/ \\___ \\  |  |  / __ \\  ___/ \\ \\|    |   \\|        \\/        \\  |    |    ");
        console.log("  \\______  /\\___  >____  > |__| (____  /\\___  >\\ \\____|_  /_______  /_______  /  |____|    ");
        console.log("         \\/     \\/     \\/            \\/     \\/  \\/      \\/        \\/        \\/             ");
        console.log("             Copyright (c) 2025, Dark Fox Technology, LLC. All Rights Reserved              ");
        console.log("             Imparative, Event-based REST Framework for Node.js and TypeScript.             ");
        console.log("                   Designed and intially developed by Robert R Murrell                      ");
        console.log();
        console.log();
        console.log(`Version: ${VERSION}`);
        console.log("Visit https://gestaejs.com for more socumentation, latest features, and more information.   ");
        console.log("You can also find us on github at git+https://github.com/murrellrr/gestae.git");
        console.log();
        console.log();
        
        if(port !== undefined) this.options.port = port;
        await this._start();

        return this;
    }
}

export function createApplication(options: IApplicationOptions = {}): IApplication {
    return new Application(options);
}