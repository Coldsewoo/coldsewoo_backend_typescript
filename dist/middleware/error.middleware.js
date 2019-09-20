"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function errorMiddleware(error, req, res, next) {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    const type = error.type || "UnexpectedError";
    res.status(status).json({ message, type });
}
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map