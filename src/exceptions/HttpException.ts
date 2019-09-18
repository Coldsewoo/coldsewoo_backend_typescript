export class HttpException extends Error {
  status: number
  message: string
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.message = message
  }
}


export class NotFound extends HttpException {
  constructor(item: string) {
    super(404, `${item} Not Found`)
  }
}

export class TooManyRequests extends HttpException {
  constructor() {
    super(429, `Too Many Requests`)
  }
}


export class InternalServerError extends HttpException {
  constructor() {
    super(500, `Internal Server Error`)
  }
}
