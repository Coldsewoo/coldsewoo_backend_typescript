export class HttpException extends Error {
  status: number
  message: string
  type?: string
  constructor(status: number, message: string, type?: string) {
    super(message)
    this.status = status
    this.message = message
    this.type = type || "UnexpectedError"
  }
}


export class NotFound extends HttpException {
  constructor(item: string) {
    super(404, `${item} Not Found`, "NotFoundError")
  }
}

export class TooManyRequests extends HttpException {
  constructor() {
    super(429, `Too Many Requests`, "TooManyRequests")
  }
}


export class InternalServerError extends HttpException {
  constructor() {
    super(500, `Internal Server Error`)
  }
}
