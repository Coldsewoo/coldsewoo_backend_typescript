import * as mongoose from "mongoose"
import { Document, Schema, Model, model } from "mongoose"
import * as bcrypt from 'bcrypt'
import { IUserDocument } from "./user.interface"

export interface IUser extends IUserDocument {
  authenticate(password: string): boolean
  originalPassword: string
}

export interface IUserModel extends Model<IUser> {
  // hashPassword(password: string): string
}

const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      match: [/^.{4,12}$/, "Should be 4-12 characters!"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      select: false,
    },
    nickname: {
      type: String,
      required: [true, "Nickname is required!"],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Should be a vaild email address!",
      ],
      trim: true,
      lowercase: true,
      unique: true
    },
    avatar: {
      type: String,
    },
    status: {
      type: String,
    },
    created: {
      type: Number,
    },
    follower: { type: [String], default: [] },
    follows: { type: [String], default: [] },
    block: { type: [String], defalut: [] },
    role: { type: String, default: "User" },
    resetPassword: {
      code: { type: String },
      expired: { type: Number },
    },
  },
  {
    toObject: { virtuals: true },
  },
)

// virtuals
userSchema
  .virtual("passwordConfirmation")
  .get(function () {
    return this._passwordConfirmation
  })
  .set(function (value: string) {
    this._passwordConfirmation = value
  })

userSchema
  .virtual("originalPassword")
  .get(function () {
    return this._originalPassword
  })
  .set(function (value: string) {
    this._originalPassword = value
  })

userSchema
  .virtual("currentPassword")
  .get(function () {
    return this._currentPassword
  })
  .set(function (value: string) {
    this._currentPassword = value
  })

userSchema
  .virtual("newPassword")
  .get(function () {
    return this._newPassword
  })
  .set(function (value: string) {
    this._newPassword = value
  })

userSchema
  .virtual("reset")
  .get(function () {
    return this._reset
  })
  .set(function (value: string) {
    this._reset = value
  })

const passwordRegex: RegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
const passwordRegexErrorMessage: string =
  "Password should be minimum 8 characters of alphabet and number combination!"

userSchema.path("password").validate(function (v: any) {
  const user = this
  // create user
  if (user.isNew) {
    if (!user.passwordConfirmation) {
      user.invalidate("passwordConfirmation", "Password Confirmation is required!")
    }
    if (!passwordRegex.test(user.password)) {
      user.invalidate("password", passwordRegexErrorMessage)
    } else if (user.password !== user.passwordConfirmation) {
      user.invalidate("passwordConfirmation", "Password Confirmation does not matched!")
    }
  }

  // update user profile
  if (!user.isNew) {
    // if reset password
    if (user.reset) {
      if (user.newPassword && !passwordRegex.test(user.newPassword)) {
        user.invalidate("newPassword", passwordRegexErrorMessage)
      } else if (user.newPassword !== user.passwordConfirmation) {
        user.invalidate("passwordConfirmation", "Password Confirmation does not matched!")
      }
    } else {
      if (!user.currentPassword) {
        user.invalidate("currentPassword", "Current Password is required!")
      }
      if (
        user.currentPassword &&
        !bcrypt.compareSync(user.currentPassword, user.originalPassword)
      ) {
        user.invalidate("currentPassword", "Current Password is invalid!")
      }
      if (user.newPassword && !passwordRegex.test(user.newPassword)) {
        user.invalidate("newPassword", passwordRegexErrorMessage)
      } else if (user.newPassword !== user.passwordConfirmation) {
        user.invalidate("passwordConfirmation", "Password Confirmation does not matched!")
      }
    }
  }
})

// hash password
userSchema.pre<IUser>("save", function (next: mongoose.HookNextFunction) {

  const user = this
  const ownerUsername = ["coldsewoo"]
  const adminUsername = ["admin"]
  if (!user.avatar)
    user.avatar =
      "https://res.cloudinary.com/coldsewoo/image/upload/v1558868166/Assets/purpleuser_kymtpc.png"
  if (ownerUsername.includes(user.username)) user.role = "Owner"
  if (adminUsername.includes(user.username)) user.role = "Admin"
  if (!user.isModified("password")) {
    return next()
  }
  user.password = bcrypt.hashSync(user.password, 10)
  return next()
})

userSchema.method("authenticate", function (password: string) {
  const user = this
  return bcrypt.compareSync(password, user.password)
})

const userModel: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema)

export default userModel
