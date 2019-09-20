"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpException extends Error {
    constructor(status, message, type) {
        super(message);
        this.status = status;
        this.message = message;
        this.type = type || "UnexpectedError";
    }
}
exports.HttpException = HttpException;
class NotFound extends HttpException {
    constructor(item) {
        super(404, `${item} Not Found`, "NotFoundError");
    }
}
exports.NotFound = NotFound;
class TooManyRequests extends HttpException {
    constructor() {
        super(429, `Too Many Requests`, "TooManyRequests");
    }
}
exports.TooManyRequests = TooManyRequests;
class InternalServerError extends HttpException {
    constructor() {
        super(500, `Internal Server Error`);
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=HttpException.js.map