"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const HttpAuthException_1 = require("../exceptions/HttpAuthException");
const tokenConfig_1 = require("../config/tokenConfig");
const util = {};
util.isLoggedin = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token)
        return next(new HttpAuthException_1.AuthenticationTokenMissingException());
    jwt.verify(token, tokenConfig_1.default.tokenSecret, (err, decoded) => {
        if (err) {
            next(new HttpAuthException_1.WrongAuthenticationTokenException());
        }
        else {
            req.decoded = decoded;
            next();
        }
    });
};
util.authLevel = (req, res, next) => {
    const roleArr = ["User", "Admin", "Owner"];
    res.locals.authLevel = roleArr.indexOf(req.decoded.role);
    next();
};
exports.default = util;
//# sourceMappingURL=utils.js.map