"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const jwt = require("jsonwebtoken");
// Exceptions
const ValidationErrorsException_1 = require("../../exceptions/ValidationErrorsException");
const ExceptionLogger_1 = require("../../exceptions/ExceptionLogger");
const HttpAuthException_1 = require("../../exceptions/HttpAuthException");
// Middlewares and DTO
const validation_middleware_1 = require("../../middleware/validation.middleware");
const user_dto_1 = require("../users/user.dto");
const login_dto_1 = require("./login.dto");
// Mongoose Model
const user_model_1 = require("../users/user.model");
// Config files
const tokenConfig_1 = require("../../config/tokenConfig");
const { tokenLife, tokenSecret, refreshTokenLife, refreshSecret } = tokenConfig_1.default;
class AuthenticationController {
    constructor() {
        this.path = "/auth";
        this.router = express.Router();
        this.User = user_model_1.default;
        this.createToken = (user, access = true) => {
            const life = access ? tokenLife : refreshTokenLife;
            const expiresIn = Date.now() + life * 1000;
            const secret = access ? tokenSecret : refreshSecret;
            const dataStoredInToken = {
                _id: user.id,
                username: user.username,
                role: user.role
            };
            return {
                expiresIn,
                token: jwt.sign(dataStoredInToken, `${secret}`, { expiresIn })
            };
        };
        this.registration = async (req, res, next) => {
            const userData = req.body;
            if (await this.User.findOne({ email: userData.email })) {
                next(new HttpAuthException_1.UserWithThatParamAlreadyExistsException("email", userData.email));
            }
            else {
                const user = new this.User(userData);
                const date = new Date();
                const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(-2)}${`0${date.getDate()}`.slice(-2)}`;
                user.created = parseInt(today);
                try {
                    await user.save();
                    res.sendStatus(200);
                }
                catch (err) {
                    if (err.name === "ValidationError")
                        next(new ValidationErrorsException_1.ValidationErrors(err));
                    else if (err.code === 11000 && err.errmsg.indexOf("nickname") > -1)
                        next(new ValidationErrorsException_1.ValidationError("Nickname", user.nickname));
                    else if (err.code === 11000 && err.errmsg.indexOf("username") > -1)
                        next(new ValidationErrorsException_1.ValidationError("Username", user.username));
                    else {
                        next(new ExceptionLogger_1.default("AuthController.registration", err));
                    }
                }
            }
        };
        this.loggingIn = (req, res, next) => {
            const loginData = req.body;
            this.User.findOne({ username: loginData.username })
                .select({ password: 1, username: 1, email: 1, role: 1 })
                .exec(async (err, user) => {
                if (err) {
                    return next(new ExceptionLogger_1.default("AuthController.loggingIn", err));
                }
                if (!user || !user.authenticate(loginData.password)) {
                    return next(new HttpAuthException_1.WrongCredentialsException());
                }
                try {
                    const tokenRes = this.createToken(user);
                    const token = tokenRes.token;
                    const expiresIn = tokenRes.expiresIn;
                    const refreshTokenRes = this.createToken(user, false);
                    const refreshToken = refreshTokenRes.token;
                    const refreshTokenExpiresIn = refreshTokenRes.expiresIn;
                    const response = {
                        token,
                        username: req.body.username,
                        refreshToken,
                        expiresIn,
                        refreshTokenExpiresIn,
                        role: user.role
                    };
                    return res.json(response);
                }
                catch (err) {
                    next(new ExceptionLogger_1.default("AuthController.loggingIn", err));
                }
            });
        };
        this.loginCheck = (req, res, next) => {
            const accessToken = req.headers["x-access-token"];
            if (!accessToken)
                return next(new HttpAuthException_1.AuthenticationTokenMissingException());
            jwt.verify(accessToken, tokenSecret, function (err, decoded) {
                if (err) {
                    if (err.name === "TokenExpiredError") {
                        return next(new HttpAuthException_1.AccessTokenExpiredException());
                    }
                    else {
                        return next(new HttpAuthException_1.WrongAuthenticationTokenException());
                    }
                }
                else {
                    next(decoded);
                }
            });
        };
        this.tokenRefresh = (req, res, next) => {
            const { refreshToken, refreshTokenExpiresIn } = req.body;
            jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
                if (err) {
                    if (err.message === "invalid token")
                        return next(new HttpAuthException_1.WrongAuthenticationTokenException());
                    else
                        next(new HttpAuthException_1.RefreshTokenExpiredException());
                }
                this.User.findOne({ username: decoded.username })
                    .select({ username: 1, email: 1, nickname: 1, role: 1 })
                    .exec(async (err, user) => {
                    if (err)
                        return next(new ExceptionLogger_1.default("AuthController.tokenRefresh", err));
                    try {
                        const tokenRes = this.createToken(user);
                        const { token, expiresIn } = tokenRes;
                        const response = {
                            token,
                            username: user.username,
                            refreshToken,
                            refreshTokenExpiresIn,
                            expiresIn,
                            role: user.role
                        };
                        res.json(response);
                    }
                    catch (err) {
                        next(new ExceptionLogger_1.default("AuthController.tokenRefresh", err));
                    }
                });
            });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/register`, validation_middleware_1.default(user_dto_1.default), this.registration);
        this.router.post(`${this.path}/login`, validation_middleware_1.default(login_dto_1.default), this.loggingIn);
        this.router.get(`${this.path}/logincheck`, this.loginCheck);
        this.router.post(`${this.path}/refresh`, this.tokenRefresh);
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=auth.controller.js.map