import { HttpException } from "./HttpException"

export class UserWithThatParamAlreadyExistsException extends HttpException {
  constructor(param: string, value: string) {
    super(400, `User with ${param} '${value}' already exists`)
  }
}

export class AuthenticationTokenMissingException extends HttpException {
  constructor() {
    super(401, 'Authentication token missing', "InvalidTokenError")
  }
}

export class WrongAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Invalid Token provided', "InvalidTokenError")
  }
}

export class AccessTokenExpiredException extends HttpException {
  constructor() {
    super(401, 'Access Token Expired', "AccessTokenExpiredError")
  }
}

export class RefreshTokenExpiredException extends HttpException {
  constructor() {
    super(401, 'Refresh Token Expired', "RefreshTokenExpiredError")
  }
}

export class WrongCredentialsException extends HttpException {
  constructor() {
    super(401, 'Wrong credentials provided', 'WrongCredentialsError')
  }
}


export class NoAuthorization extends HttpException {
  constructor() {
    super(403, 'Yout don\'t have permission to do this action', "NoAuthorizationError")
  }
}
