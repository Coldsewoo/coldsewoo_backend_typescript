"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const axios = require("axios").default;
const ExceptionLogger_1 = require("../../exceptions/ExceptionLogger");
class CurrencyController {
    constructor() {
        this.path = "/currency";
        this.router = express.Router();
        this.getCurrencyRate = (req, res, next) => {
            const originCode = req.params.originCode;
            axios({
                url: `https://api.exchangeratesapi.io/latest?base=${originCode}`,
                method: "GET",
            }).then((result) => {
                res.json(result.data);
            }).catch((err) => {
                next(new ExceptionLogger_1.default("currencyController.getCurrencyRate", err));
            });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/:originCode`, this.getCurrencyRate);
    }
}
exports.default = CurrencyController;
//# sourceMappingURL=currency.controller.js.map