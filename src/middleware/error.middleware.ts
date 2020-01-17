import { NextFunction, Request, Response } from 'express'
import { HttpException } from '../exceptions/HttpException'

function errorMiddleware(error: HttpException, req: Request, res: Response, next: NextFunction) {
  const status = error.status || 500
  const message = error.message || 'Something went wrong! Please contact website owner'
  const type = error.type || "UnexpectedError"
  res.status(status).json({ message, type, status })
}

export default errorMiddleware
