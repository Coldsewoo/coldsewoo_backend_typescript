"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function errorMiddleware(error, req, res, next) {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong! Please contact website owner';
    const type = error.type || "UnexpectedError";
    res.status(status).json({ message, type, status });
}
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map