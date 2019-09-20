"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const nodemailer = require("nodemailer");
const smptTransport = require("nodemailer-smtp-transport");
const user_dto_1 = require("./user.dto");
const user_model_1 = require("./user.model");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const HttpException_1 = require("../../exceptions/HttpException");
const HttpAuthException_1 = require("../../exceptions/HttpAuthException");
const utils_1 = require("../../utils/utils");
const ExceptionLogger_1 = require("../../exceptions/ExceptionLogger");
const emailConfig_1 = require("../../config/emailConfig");
const ValidationErrorsException_1 = require("../../exceptions/ValidationErrorsException");
class UsersController {
    constructor() {
        this.path = '/users';
        this.router = express.Router();
        this.User = user_model_1.default;
        this.getAllUsers = async (req, res, next) => {
            try {
                const users = await this.User.find();
                res.send(users);
            }
            catch (err) {
                next(new HttpException_1.InternalServerError());
            }
        };
        this.getUserByUsername = async (req, res, next) => {
            const username = req.params.username;
            try {
                const user = await this.User.findOne({ username });
                if (user) {
                    res.send(user);
                }
                else {
                    next(new HttpException_1.NotFound('User'));
                }
            }
            catch (err) {
                next(new ExceptionLogger_1.default("userController.getUserByUsername", err));
            }
        };
        this.modifyUser = async (req, res, next) => {
            const username = req.params.username;
            const usernameInToken = req.decoded.username;
            const authLevel = res.locals.authLevel;
            if (username === usernameInToken || authLevel >= 2) {
                try {
                    this.User.findOne({ username })
                        .select({ password: 1, avatar: 1 })
                        .exec(function (err, user) {
                        if (err)
                            return next(new ExceptionLogger_1.default("UserController.modifyUser", err));
                        if (!user)
                            return next(new HttpException_1.NotFound("User"));
                        user.originalPassword = user.password;
                        user.password = req.body.newPassword ? req.body.newPassword : user.password;
                        user.currentPassword = req.body.currentPassword;
                        for (const p in req.body) {
                            user[p] = req.body[p];
                        }
                        user.save((err, user) => {
                            if (err)
                                return next(new ExceptionLogger_1.default("UserController.modifyUser", err));
                            user.password = undefined;
                            res.sendStatus(200);
                        });
                    });
                }
                catch (err) {
                }
            }
        };
        this.deleteUser = (req, res, next) => {
            const _id = req.params._id;
            const username = req.decoded.username;
            const authLevel = res.locals.authLevel;
            this.User.findOne({ _id }).exec((err, user) => {
                if (err)
                    return next(new ExceptionLogger_1.default("UserController.deleteUser", err));
                if (!user)
                    return next(new HttpException_1.NotFound("User"));
                if (user.username !== username && authLevel !== 2) {
                    return next(new HttpAuthException_1.NoAuthorization());
                }
                user.remove(function (err, result) {
                    if (err)
                        return next(new ExceptionLogger_1.default("UserController.deleteUser", err));
                    res.sendStatus(200);
                });
            });
        };
        this.sendResetEmail = (req, res, next) => {
            const username = req.body.username;
            const { USER, PASS, SERVICE, HOST } = emailConfig_1.default;
            this.User.findOne({ username }).exec(function (err, user) {
                if (err)
                    return next(new ExceptionLogger_1.default("UserController.sendResetEmail", err));
                if (!user)
                    return next(new HttpException_1.NotFound("User"));
                const to = user.email;
                const from = USER;
                const subject = "[coldesewooWEB] Reset your password";
                const randomCode = [...Array(60)].map(() => Math.random().toString(36)[2]).join("");
                const html = `<p>Please Copy &amp; Paste the code below :&nbsp;</p>
      <p><strong>${randomCode}</strong></p>
      `;
                const transporter = nodemailer.createTransport(smptTransport({
                    service: SERVICE,
                    host: HOST,
                    auth: { user: USER, pass: PASS }
                }));
                const mailOptions = { from, to, subject, html };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err)
                        return next(new ExceptionLogger_1.default("userController.sendEmail", err));
                    const date = new Date();
                    const resetPassword = {
                        code: randomCode,
                        expired: date.getTime() + 1000 * 60 * 60 // an hour
                    };
                    user.resetPassword = resetPassword;
                    user.save((err, result) => {
                        if (err)
                            return next(new ExceptionLogger_1.default("userController.sendEmail", err));
                        res.json({ email: user.email });
                    });
                });
            });
        };
        this.sendResetCode = (req, res, next) => {
            const code = req.body.code;
            this.User.findOne({ "resetPassword.code": code }).exec((err, user) => {
                if (err || !user)
                    return next(new HttpException_1.HttpException(401, "Invalid Code!"));
                const cDate = new Date();
                if (cDate.getTime() >= user.resetPassword.expired) {
                    return next(new HttpException_1.HttpException(401, "Reset Code Expired!"));
                }
                res.sendStatus(200);
            });
        };
        this.sendResetPassword = (req, res, next) => {
            this.User.findOne({ "resetPassword.code": req.body.code })
                .select({ password: 1, avatar: 1 })
                .exec((err, user) => {
                if (err)
                    return next(new ExceptionLogger_1.default("userController.sendResetPassword", err));
                if (!user)
                    return next(new HttpException_1.InternalServerError());
                user.originalPassword = user.password;
                user.password = req.body.newPassword ? req.body.newPassword : user.password;
                for (const p in req.body) {
                    user[p] = req.body[p];
                }
                user.reset = true;
                user.save((err, result) => {
                    if (err) {
                        if (err.name === "ValidationError")
                            return next(new ValidationErrorsException_1.ValidationErrors(err));
                        else
                            return next(new ExceptionLogger_1.default("userController.sendResetPassword", err));
                    }
                    result.password = undefined;
                    res.json(result);
                });
            });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(this.path, this.getAllUsers);
        this.router.get(`${this.path}/:username`, this.getUserByUsername);
        this.router.put(`${this.path}/:username`, utils_1.default.isLoggedin, utils_1.default.authLevel, validation_middleware_1.default(user_dto_1.default, true), this.modifyUser);
        this.router.delete(`${this.path}/:_id`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.deleteUser);
        this.router.post(`${this.path}/reset`, this.sendResetEmail);
        this.router.post(`${this.path}/resetcode`, this.sendResetCode);
        this.router.post(`${this.path}/resetpassword`, this.sendResetPassword);
    }
}
exports.default = UsersController;
//# sourceMappingURL=user.controller.js.map