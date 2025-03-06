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

    safe() {
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
export class StartupError extends GestaeError {
    constructor(message: string, cause?: any) {
        super(message, 500, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class BadRequestError extends GestaeError {
    constructor(cause?: any) {
        super("Bad Request.", 400, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NotAuthorizedError extends GestaeError {
    constructor(cause?: any) {
        super("Not Authorized.", 401, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ForbiddenError extends GestaeError {
    constructor(cause?: any) {
        super('Forbidden.', 403, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NotFoundError extends GestaeError {
    constructor(path?:string, cause?: any) {
        super(`${path ? "'" + path + "' " : ""}Not Found.`, 404, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class MethodNotAllowedError extends GestaeError {
    constructor(cause?: any) {
        super("Method Not Allowed.", 405, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NotAcceptableError extends GestaeError {
    constructor(cause?: any) {
        super("Not Acceptable.", 406, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class RequestTimeoutError extends GestaeError {
    constructor(cause?: any) {
        super("RequestTimeout.", 408, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ConflictError extends GestaeError {
    constructor(cause?: any) {
        super("Conflict.", 409, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class RequestEntityTooLargeError extends GestaeError {
    constructor(cause?: any) {
        super("Request Entity Too Large.", 413, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class UnsupportedMediaTypeError extends GestaeError {
    constructor(cause?: any) {
        super("Unsupported Media Type.", 415, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class UnprocessableEntityError extends GestaeError {
    constructor(cause?: any) {
        super("Unprocessable Entity.", 422, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TooEarlyError extends GestaeError {
    constructor(cause?: any) {
        super("Too Early.", 425, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class PreconditionRequiredError extends GestaeError {
    constructor(cause?: any) {
        super("Precondition Required.", 428, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class TooManyRequestsError extends GestaeError {
    constructor(cause?: any) {
        super("Too Many Requests.", 429, cause);
        this.name = this.constructor.name;
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

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class NotImplementedError extends GestaeError {
    constructor(cause?: any) {
        super("Not Implemented.", 501, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class BadGatewayError extends GestaeError {
    constructor(cause?: any) {
        super("Bad Gateway.", 502, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class ServiceUnavailableError extends GestaeError {
    constructor(cause?: any) {
        super("Service Unavailable.", 503, cause);
        this.name = this.constructor.name;
    }
}

/**
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class GatewayTimeoutError extends GestaeError {
    constructor(cause?: any) {
        super("Gateway Timeout.", 504, cause);
        this.name = this.constructor.name;
    }
}

export class CancelError extends InternalServerError {
    constructor(reaon?: any) {
        super(reaon ?? "Request Canceled.");
        this.name = this.constructor.name;
    }
}