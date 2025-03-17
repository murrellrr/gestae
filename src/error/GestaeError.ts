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

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class GestaeError extends Error {
    private readonly _code: number = 500;
    private readonly _cause?: any;

    constructor(message: string, code: number = 500, cause?: any) {
        super(message);
        this.name = "GestaeError";
        this._code = code;
        this._cause = cause;
    }

    get code(): number {
        return this._code;
    }

    get cause(): any {
        return this._cause;
    }

    toJSON(): any {
        return {message: this.message, code: this._code, cause: this._cause};
    }

    get safe(): object {
        return {message: this.message, code: this._code};
    }

    static toError(error?: any, code: number = 500): GestaeError {
        if(!error) return new InternalServerError();
        if(error instanceof GestaeError) return error;
        if(error instanceof Error || typeof error === "string") return new GestaeError("Unhandled Error.", code, error);
        if(typeof error === "number") return new GestaeError("Unhandled Error.", error ?? code);
        if(typeof error === "object")
            return new GestaeError(error?.message ?? "Unhandled Error.", error?.code ?? code, error);
        return new InternalServerError();
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class InternalServerError extends GestaeError {
    constructor(cause?: any) {
        super("Internal Server Error.", 500, cause);
        this.name = this.constructor.name;
    }
}
