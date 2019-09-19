import { HttpException } from "./HttpException"

export class ValidationErrors extends HttpException {
  constructor(err: any) {
    const message: string[] = []
    for (let errors in err.errors) {
      message.push(`${err.errors[errors].properties.message}`)
    }
    const returnMessage = message.join(", ")
    super(400, `${returnMessage}`, "ValidationError")
  }
}

export class ValidationError extends HttpException {
  constructor(errmsg: string, value: string) {
    super(400, `${errmsg} '${value}' already exists!`, "ValidationError")
  }
}
