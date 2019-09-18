import { Request } from "express"

export interface DataStoredInToken {
  _id: string
  username: string
  role: string
}

export interface RequestWithUser extends Request {
  decoded?: TokenResponse
}

export interface TokenData {
  expiresIn: number
  token: string
}

export interface TokenResponse {
  token: string
  username: string
  refreshToken: string
  expiresIn: number
  refreshTokenExpiresIn: number
  role: string
}
