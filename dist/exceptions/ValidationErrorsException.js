"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpException_1 = require("./HttpException");
class ValidationErrors extends HttpException_1.HttpException {
    constructor(err) {
        const message = [];
        for (let errors in err.errors) {
            message.push(`${err.errors[errors].properties.message}`);
        }
        const returnMessage = message.join(", ");
        super(400, `${returnMessage}`, "ValidationError");
    }
}
exports.ValidationErrors = ValidationErrors;
class ValidationError extends HttpException_1.HttpException {
    constructor(errmsg, value) {
        super(400, `${errmsg} '${value}' already exists!`, "ValidationError");
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=ValidationErrorsException.js.map