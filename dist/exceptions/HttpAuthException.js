"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpException_1 = require("./HttpException");
class UserWithThatParamAlreadyExistsException extends HttpException_1.HttpException {
    constructor(param, value) {
        super(400, `User with ${param} '${value}' already exists`);
    }
}
exports.UserWithThatParamAlreadyExistsException = UserWithThatParamAlreadyExistsException;
class AuthenticationTokenMissingException extends HttpException_1.HttpException {
    constructor() {
        super(401, 'Authentication token missing', "InvalidTokenError");
    }
}
exports.AuthenticationTokenMissingException = AuthenticationTokenMissingException;
class WrongAuthenticationTokenException extends HttpException_1.HttpException {
    constructor() {
        super(401, 'Invalid Token provided', "InvalidTokenError");
    }
}
exports.WrongAuthenticationTokenException = WrongAuthenticationTokenException;
class AccessTokenExpiredException extends HttpException_1.HttpException {
    constructor() {
        super(401, 'Access Token Expired', "AccessTokenExpiredError");
    }
}
exports.AccessTokenExpiredException = AccessTokenExpiredException;
class RefreshTokenExpiredException extends HttpException_1.HttpException {
    constructor() {
        super(401, 'Refresh Token Expired', "RefreshTokenExpiredError");
    }
}
exports.RefreshTokenExpiredException = RefreshTokenExpiredException;
class WrongCredentialsException extends HttpException_1.HttpException {
    constructor() {
        super(401, 'Wrong credentials provided');
    }
}
exports.WrongCredentialsException = WrongCredentialsException;
class NoAuthorization extends HttpException_1.HttpException {
    constructor() {
        super(403, 'Yout don\'t have permission to do this action');
    }
}
exports.NoAuthorization = NoAuthorization;
//# sourceMappingURL=HttpAuthException.js.map