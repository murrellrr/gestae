

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

    static toError(error?: any): GestaeError {
        if(error instanceof GestaeError) return error;
        if(error instanceof Error) return new InternalServerError(error.message);
        if(typeof error === "string") return new InternalServerError(error);
        if(typeof error === "number") return new GestaeError("Unhandled Error.", error);
        if(typeof error === "object")
            return new GestaeError(error?.message ?? "Unhandled Error.", error?.code ?? 500, error);
        return new InternalServerError();
    }
}

export class StartupError extends GestaeError {
    constructor(message: string, cause?: any) {
        super(message, 500, cause);
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends GestaeError {
    constructor(cause?: any) {
        super("Bad Request.", 400, cause);
        this.name = this.constructor.name;
    }
}

export class NotAuthorizedError extends GestaeError {
    constructor(cause?: any) {
        super("Not Authorized.", 401, cause);
        this.name = this.constructor.name;
    }
}

export class ForbiddenError extends GestaeError {
    constructor(cause?: any) {
        super('Forbidden.', 403, cause);
        this.name = this.constructor.name;
    }
}

export class NotFoundError extends GestaeError {
    constructor(cause?: any) {
        super("Not Found.", 404, cause);
        this.name = this.constructor.name;
    }
}

export class UnprocessableEntityError extends GestaeError {
    constructor(cause?: any) {
        super("Unprocessable Entity.", 422, cause);
        this.name = this.constructor.name;
    }
}

export class InternalServerError extends GestaeError {
    constructor(cause?: any) {
        super("Internal Server Error.", 500, cause);
        this.name = this.constructor.name;
    }
}

export class NotImplementedError extends GestaeError {
    constructor(cause?: any) {
        super("Not Implemented.", 501, cause);
        this.name = this.constructor.name;
    }
}