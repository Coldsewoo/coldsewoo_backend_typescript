import * as express from 'express'
const axios = require("axios").default
import { Request, Response, NextFunction } from "express"
import Controller from 'interfaces/controller.interface'
import ExceptionLogger from '../../exceptions/ExceptionLogger'

export default class CurrencyController implements Controller {
  public path = "/currency"
  public router = express.Router()
  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:originCode`, this.getCurrencyRate)
  }

  private getCurrencyRate = (req: Request, res: Response, next: NextFunction) => {
    const originCode = req.params.originCode
    axios({
      url: `https://api.exchangeratesapi.io/latest?base=${originCode}`,
      method: "GET",
    }).then((result: any) => {
      res.json(result.data)
    }).catch((err: any) => {
      next(new ExceptionLogger("currencyController.getCurrencyRate", err))
    })
  }

}
