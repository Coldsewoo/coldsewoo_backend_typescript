import { HttpException } from "./HttpException";

export default class ExceptionLogger extends HttpException {
  constructor(position: string, error: any) {
    let message: string | string[] = []
    message.push(`----Error raised at ${position}----\n`)
    message.push(error)
    message.push(`\n----END----`)
    message = message.join("")
    console.log(message)
    super(500, error.message)
  }
}
