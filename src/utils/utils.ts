import jwt = require("jsonwebtoken")
import { Response, NextFunction } from "express";
import { AuthenticationTokenMissingException, WrongAuthenticationTokenException } from "../exceptions/HttpAuthException";
import { RequestWithUser, TokenResponse } from "../interfaces/auth.interface";
import tokenConfig from "../config/tokenConfig"

type Util = {
  isLoggedin?: any
  authLevel?: any
}
const util: Util = {}

util.isLoggedin = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const token: string = req.headers["x-access-token"] as string
  if (!token) return next(new AuthenticationTokenMissingException())

  jwt.verify(token, tokenConfig.tokenSecret, (err: jwt.VerifyErrors, decoded: TokenResponse) => {
    if (err) {
      next(new WrongAuthenticationTokenException())
    } else {
      req.decoded = decoded
      next()
    }
  })
}

util.authLevel = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const roleArr = ["User", "Admin", "Owner"]
  res.locals.authLevel = roleArr.indexOf(req.decoded.role)
  next()
}

export default util
