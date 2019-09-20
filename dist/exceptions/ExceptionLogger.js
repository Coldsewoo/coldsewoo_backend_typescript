"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpException_1 = require("./HttpException");
class ExceptionLogger extends HttpException_1.HttpException {
    constructor(position, error) {
        let message = [];
        message.push(`----Error raised at ${position}----\n`);
        message.push(error);
        message.push(`\n----END----`);
        message = message.join("");
        console.log(message);
        super(500, error.message, "ExceptionLogger");
    }
}
exports.default = ExceptionLogger;
//# sourceMappingURL=ExceptionLogger.js.map