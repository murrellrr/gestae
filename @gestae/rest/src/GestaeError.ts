

export class GestaeError extends Error {
    constructor(message: string, public code: number = 500, public data?: any) {
        super(message);
        this.name = "GestaeError";
    }
}

export class StartupError extends GestaeError {
    constructor(message: string, public data?: any) {
        super(message, 500, data);
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends GestaeError {
    constructor(public data?: any) {
        super("Bad Request.", 400, data);
        this.name = this.constructor.name;
    }
}

export class NotAuthorizedError extends GestaeError {
    constructor(public data?: any) {
        super("Not Authorized.", 401, data);
        this.name = this.constructor.name;
    }
}

export class ForbiddenError extends GestaeError {
    constructor(public data?: any) {
        super('Forbidden.', 403, data);
        this.name = this.constructor.name;
    }
}

export class NotFoundError extends GestaeError {
    constructor(public data?: any) {
        super("Not Found.", 404, data);
        this.name = this.constructor.name;
    }
}

export class UnprocessableEntityError extends GestaeError {
    constructor(public data?: any) {
        super("Unprocessable Entity.", 422, data);
        this.name = this.constructor.name;
    }
}

export class InternalServerError extends GestaeError {
    constructor(public data?: any) {
        super("Internal Server Error.", 500, data);
        this.name = this.constructor.name;
    }
}