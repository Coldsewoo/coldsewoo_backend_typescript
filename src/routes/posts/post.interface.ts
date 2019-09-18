import * as mongoose from "mongoose"

export interface IPostDocument extends mongoose.Document {
  username: string
  userNickname: string
  userAvatar: string
  message?: string
  categories?: string[]
  imageURL?: string
  imagepId?: string
  likes?: Likes[]
  likesCount?: number
  likePressed?: boolean
  filter?: string
  created?: number
  id?: number
  thumbnail?: string
  comments?: Comment[]
}

interface Likes {
  username: string
  userNickname: string
  _id: string
}

export interface PostQuery {
  username: string
  userNickname: string
  userAvatar: string
  message?: string
  imageURL?: string
  imagePId?: string
  filter?: string
  thumbnail?: string
}

export interface Comment extends mongoose.Document {
  username: string
  userNickname: string
  userAvatar: string
  likes?: Likes[]
  likesCount?: number
  likePressed?: boolean
  created?: number
  message: string
}

export interface CommentQuery {
  post_id: string
  commentInput: string
}
