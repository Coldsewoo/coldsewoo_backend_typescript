import express = require('express')
import jwt = require("jsonwebtoken")
import { Request, Response, NextFunction } from "express";
// Exceptions
import { ValidationErrors, ValidationError } from "../../exceptions/ValidationErrorsException"
import ExceptionLogger from "../../exceptions/ExceptionLogger"

import { UserWithThatParamAlreadyExistsException, WrongAuthenticationTokenException, AccessTokenExpiredException, RefreshTokenExpiredException, WrongCredentialsException, AuthenticationTokenMissingException } from "../../exceptions/HttpAuthException"

// Middlewares and DTO
import validationMiddleware from '../../middleware/validation.middleware'
import CreateUserDto from "../users/user.dto"
import LogInDto from "./login.dto"
// Mongoose Model
import userModel from "../users/user.model"
// Interfaces
import Controller from "../../interfaces/controller.interface"
import { IUserDocument } from "../users/user.interface"
import { DataStoredInToken, TokenData, TokenResponse } from '../../interfaces/auth.interface'
// Config files
import tokenConfig from "../../config/tokenConfig"
const { tokenLife, tokenSecret, refreshTokenLife, refreshSecret } = tokenConfig


export default class AuthenticationController implements Controller {
  public path = "/auth"
  public router = express.Router()
  private User = userModel

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.registration)
    this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn)
    this.router.get(`${this.path}/logincheck`, this.loginCheck)
    this.router.post(`${this.path}/refresh`, this.tokenRefresh)
  }

  private createToken = (user: IUserDocument, access = true): TokenData => {
    const life = access ? tokenLife : refreshTokenLife as number
    const expiresIn = Date.now() + life * 1000
    const secret = access ? tokenSecret : refreshSecret
    const dataStoredInToken: DataStoredInToken = {
      _id: user.id,
      username: user.username,
      role: user.role
    }
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, `${secret}`, { expiresIn })
    }
  }

  private registration = async (req: Request, res: Response, next: NextFunction) => {
    const userData: CreateUserDto = req.body
    if (await this.User.findOne({ email: userData.email })) {
      next(new UserWithThatParamAlreadyExistsException("email", userData.email))
    }
    else {
      const user: IUserDocument = new this.User(userData)
      const date = new Date()
      const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(
        -2,
      )}${`0${date.getDate()}`.slice(-2)}`
      user.created = parseInt(today)
      try {
        await user.save()
        res.sendStatus(200)
      } catch (err) {
        if (err.name === "ValidationError") next(new ValidationErrors(err))
        else if (err.code === 11000 && err.errmsg.indexOf("nickname") > -1) next(new ValidationError("Nickname", user.nickname))
        else if (err.code === 11000 && err.errmsg.indexOf("username") > -1) next(new ValidationError("Username", user.username))
        else {
          next(new ExceptionLogger("AuthController.registration", err))
        }
      }
    }
  }

  private loggingIn = (req: Request, res: Response, next: NextFunction) => {
    const loginData: LogInDto = req.body
    this.User.findOne({ username: loginData.username })
      .select({ password: 1, username: 1, email: 1, role: 1 })
      .exec(async (err, user) => {
        if (err) {
          return next(new ExceptionLogger("AuthController.loggingIn", err))
        }
        if (!user || !user.authenticate(loginData.password)) {
          return next(new WrongCredentialsException())
        }
        try {
          const tokenRes = this.createToken(user)
          const token = tokenRes.token
          const expiresIn = tokenRes.expiresIn
          const refreshTokenRes = this.createToken(user, false)
          const refreshToken = refreshTokenRes.token
          const refreshTokenExpiresIn = refreshTokenRes.expiresIn
          const response: TokenResponse = {
            token,
            username: req.body.username,
            refreshToken,
            expiresIn,
            refreshTokenExpiresIn,
            role: user.role
          }
          return res.json(response)
        } catch (err) {
          if(err) next(new ExceptionLogger("AuthController.loggingIn", err))
        }
      })

  }

  private loginCheck = (req: Request, res: Response, next: NextFunction) => {
    const accessToken: string = req.headers["x-access-token"] as string
    if (!accessToken) return next(new AuthenticationTokenMissingException())
    jwt.verify(accessToken, tokenSecret, function (err: jwt.VerifyErrors, decoded: string | object) {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return next(new AccessTokenExpiredException())
        } else {
          return next(new WrongAuthenticationTokenException())
        }
      } else {
        next(decoded)
      }
    })
  }

  private tokenRefresh = (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken, refreshTokenExpiresIn } = req.body
    jwt.verify(refreshToken, refreshSecret, (err: jwt.VerifyErrors, decoded: TokenResponse) => {
      if (err) {
        if (err.message === "invalid token") return next(new WrongAuthenticationTokenException())
        else next(new RefreshTokenExpiredException())
      }
      this.User.findOne({ username: decoded.username })
        .select({ username: 1, email: 1, nickname: 1, role: 1 })
        .exec(async (err: jwt.VerifyErrors, user: IUserDocument) => {
          if (err) return next(new ExceptionLogger("AuthController.tokenRefresh", err))
          try {
            const tokenRes = this.createToken(user)
            const { token, expiresIn } = tokenRes
            const response: TokenResponse = {
              token,
              username: user.username,
              refreshToken,
              refreshTokenExpiresIn,
              expiresIn,
              role: user.role
            }
            res.json(response)
          } catch (err) {
            if(err) next(new ExceptionLogger("AuthController.tokenRefresh", err))
          }
        })
    })
  }
}
