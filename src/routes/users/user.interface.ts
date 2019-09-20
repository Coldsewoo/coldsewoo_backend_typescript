import mongoose = require("mongoose")

export interface IUserDocument extends mongoose.Document {
  follower?: string[]
  follows?: string[]
  block?: string[]
  nickname: string
  username: string
  email: string
  role?: string
  password: string
  avatar?: string
  created?: number
  status?: string
  originalPassword?: string
  resetPassword?: resetPassword
  currentPassword?: string
}


export interface resetPassword {
  code: string
  expired: number
}
