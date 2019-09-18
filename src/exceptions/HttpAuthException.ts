import { HttpException } from "./HttpException"

export class UserWithThatParamAlreadyExistsException extends HttpException {
  constructor(param: string, value: string) {
    super(400, `User with ${param} '${value}' already exists`)
  }
}

export class AuthenticationTokenMissingException extends HttpException {
  constructor() {
    super(401, 'Authentication token missing')
  }
}

export class WrongAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Invalid Token provided')
  }
}

export class AccessTokenExpiredException extends HttpException {
  constructor() {
    super(401, 'Access Token Expired')
  }
}

export class RefreshTokenExpiredException extends HttpException {
  constructor() {
    super(401, 'Refresh Token Expired')
  }
}

export class WrongCredentialsException extends HttpException {
  constructor() {
    super(401, 'Wrong credentials provided')
  }
}


export class NoAuthorization extends HttpException {
  constructor() {
    super(403, 'Do not have permission to do this action')
  }
}
