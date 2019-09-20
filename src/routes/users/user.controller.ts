import express = require('express')
import nodemailer = require("nodemailer")
import smptTransport = require('nodemailer-smtp-transport')

import { Request, Response, NextFunction } from 'express'
import Controller from '../../interfaces/controller.interface'
import CreateUserDto from "./user.dto"
import userModel from "./user.model"
import { resetPassword, IUserDocument } from "./user.interface"

import validationMiddleware from "../../middleware/validation.middleware"
import { InternalServerError, NotFound, HttpException } from "../../exceptions/HttpException"
import { NoAuthorization } from "../../exceptions/HttpAuthException"
import util from "../../utils/utils"
import { RequestWithUser } from '../../interfaces/auth.interface'
import ExceptionLogger from '../../exceptions/ExceptionLogger'
import emailConfig from "../../config/emailConfig"
import { ValidationErrors } from '../../exceptions/ValidationErrorsException'


export default class UsersController implements Controller {
  public path = '/users'
  public router = express.Router()
  private User = userModel

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get(this.path, this.getAllUsers)
    this.router.get(`${this.path}/:username`, this.getUserByUsername)
    this.router.put(`${this.path}/:username`, util.isLoggedin, util.authLevel, validationMiddleware(CreateUserDto, true), this.modifyUser)
    this.router.delete(`${this.path}/:_id`, util.isLoggedin, util.authLevel, this.deleteUser)
    this.router.post(`${this.path}/reset`, this.sendResetEmail)
    this.router.post(`${this.path}/resetcode`, this.sendResetCode)
    this.router.post(`${this.path}/resetpassword`, this.sendResetPassword)
  }

  private getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.User.find()
      res.send(users)
    } catch (err) {
      console.log(err)
      next(new InternalServerError())
    }
  }

  private getUserByUsername = async (req: Request, res: Response, next: NextFunction) => {
    const username = req.params.username
    try {
      const user = await this.User.findOne({ username })
      if (user) {
        res.send(user)
      } else {
        next(new NotFound('User'))
      }
    } catch (err) {
      next(new ExceptionLogger("userController.getUserByUsername", err))
    }
  }


  private modifyUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const username = req.params.username
    const usernameInToken = req.decoded.username
    const authLevel = res.locals.authLevel
    if (username === usernameInToken || authLevel >= 2) {
      try {
        this.User.findOne({ username })
          .select({ password: 1, avatar: 1 })
          .exec(function (err, user: any) {
            if (err) return next(new ExceptionLogger("UserController.modifyUser", err))
            if (!user) return next(new NotFound("User"))
            user.originalPassword = user.password
            user.password = req.body.newPassword ? req.body.newPassword : user.password
            user.currentPassword = req.body.currentPassword
            for (const p in req.body) {
              user[p] = req.body[p]
            }
            user.save((err: Error, user: any) => {
              if (err) return next(new ExceptionLogger("UserController.modifyUser", err))
              user.password = undefined
              res.sendStatus(200)
            })
          })
      } catch (err) {

      }
    }
  }

  private deleteUser = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const _id = req.params._id
    const username = req.decoded.username
    const authLevel = res.locals.authLevel
    this.User.findOne({ _id }).exec((err, user) => {
      if (err) return next(new ExceptionLogger("UserController.deleteUser", err))
      if (!user) return next(new NotFound("User"))
      if (user.username !== username && authLevel !== 2) {
        return next(new NoAuthorization())
      }
      user.remove(function (err, result) {
        if (err) return next(new ExceptionLogger("UserController.deleteUser", err))
        res.sendStatus(200)
      })
    })
  }

  private sendResetEmail = (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username
    const { USER, PASS, SERVICE, HOST } = emailConfig
    this.User.findOne({ username }).exec(function (err, user) {
      if (err) return next(new ExceptionLogger("UserController.sendResetEmail", err))
      if (!user) return next(new NotFound("User"))

      const to = user.email
      const from = USER
      const subject = "[coldesewooWEB] Reset your password"
      const randomCode = [...Array(60)].map(() => Math.random().toString(36)[2]).join("")
      const html = `<p>Please Copy &amp; Paste the code below :&nbsp;</p>
      <p><strong>${randomCode}</strong></p>
      `

      const transporter: nodemailer.Transporter = nodemailer.createTransport(
        smptTransport({
          service: SERVICE,
          host: HOST,
          auth: { user: USER, pass: PASS }
        })
      )
      const mailOptions: nodemailer.SendMailOptions = { from, to, subject, html }
      transporter.sendMail(mailOptions, (err: Error, info) => {
        if (err) return next(new ExceptionLogger("userController.sendEmail", err))

        const date = new Date()
        const resetPassword: resetPassword = {
          code: randomCode,
          expired: date.getTime() + 1000 * 60 * 60 // an hour
        }
        user.resetPassword = resetPassword
        user.save((err, result) => {
          if (err) return next(new ExceptionLogger("userController.sendEmail", err))
          res.json({ email: user.email })
        })
      })
    })
  }

  private sendResetCode = (req: Request, res: Response, next: NextFunction) => {
    const code = req.body.code
    this.User.findOne({ "resetPassword.code": code }).exec((err, user) => {
      if (err || !user) return next(new HttpException(401, "Invalid Code!"))
      const cDate = new Date()
      if (cDate.getTime() >= user.resetPassword.expired) {
        return next(new HttpException(401, "Reset Code Expired!"))
      }
      res.sendStatus(200)
    })
  }

  private sendResetPassword = (req: Request, res: Response, next: NextFunction) => {
    this.User.findOne({ "resetPassword.code": req.body.code })
      .select({ password: 1, avatar: 1 })
      .exec((err, user: any) => {
        if (err) return next(new ExceptionLogger("userController.sendResetPassword", err))
        if (!user) return next(new InternalServerError())

        user.originalPassword = user.password
        user.password = req.body.newPassword ? req.body.newPassword : user.password
        for (const p in req.body) {
          user[p] = req.body[p]
        }

        user.reset = true
        user.save((err: Error, result: any) => {
          if (err) {
            if (err.name === "ValidationError") return next(new ValidationErrors(err))
            else return next(new ExceptionLogger("userController.sendResetPassword", err))
          }
          result.password = undefined
          res.json(result)
        })
      })
  }
}
