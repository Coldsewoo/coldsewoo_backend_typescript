import mongoose = require('mongoose')
import { Document, Schema, Model, model } from "mongoose"
import { IPostDocument, CommentQuery, Comment, PostQuery } from './post.interface'
import ExceptionLogger from "../../exceptions/ExceptionLogger"
import { IUser } from '../../routes/users/user.model'

export interface IPost extends IPostDocument {
  editPost(_id: mongoose.Types.ObjectId, body: PostQuery): Promise<IPost>
}
export interface IPostModel extends Model<IPost> {
  createPost(body: any): Promise<IPost>
  addComment(body: CommentQuery, user: IUser): Promise<IPost>
  likesPress(_id: mongoose.Types.ObjectId): Promise<IPost>
  findByCategory(category: string): Promise<IPost[]>
}

interface IComment extends Comment { }

interface ICommentModel extends Model<IComment> { }

const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userNickname: { type: String, required: true },
  userAvatar: { type: String, required: true },
  message: { type: String, trim: true },
  categories: [String],
  imageURL: { type: String },
  imagepId: { type: String },
  likes: [Object],
  likesCount: { type: Number },
  likePressed: { type: Boolean },
  filter: { type: String },
  created: { type: Number },
  id: { type: Number },
  thumbnail: { type: String },
  comments: [Object],
})

const commentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userNickname: { type: String, required: true },
  userAvatar: { type: String, required: true },
  likes: [String],
  likesCount: { type: Number },
  likePressed: { type: Boolean },
  created: { type: Number },
  message: { type: String, required: true },
})

postSchema.static("createPost", async function (body: PostQuery) {
  const message: IPostModel = this
  const post = new message(body)
  const date = new Date()
  const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(
    -2
  )}${`0${date.getDate()}`.slice(-2)}`
  const messageCount: number = await message.countDocuments({ created: today })
  const postId: string = pad(messageCount + 1, 3)
  for (let i = 0; i < post.categories.length; i++) {
    post.categories[i] = post.categories[i].toLowerCase()
  }
  post.filter = post.filter || 'normal'
  post.created = Number(today)
  post.likesCount = 0
  post.likes = []
  post.id = Number(`${today}${postId}`)
  post.likePressed = false
  return post.save()

  function pad(n: number, width: number): string {
    let s = n.toString()
    return s.length >= width ? s : new Array(width - s.length + 1).join('0') + s
  }
})

postSchema.static("addComment", async function (payload: CommentQuery, user: IUser) {
  const Post: IPostModel = this
  const date = new Date()
  const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(
    -2,
  )}${`0${date.getDate()}`.slice(-2)}`
  const Comment: ICommentModel = mongoose.model("comments", commentSchema)
  const comment: Comment = new Comment({
    username: user.username,
    userNickname: user.nickname,
    userAvatar: user.avatar,
    likes: [],
    likesCount: 0,
    likesPressed: false,
    created: today,
    message: payload.commentInput,
  })
  const post = await Post.findOne({ _id: payload.post_id })
  post.comments.push(comment)
  return post.save()
})

postSchema.static("likesPress", function (_id: mongoose.Types.ObjectId) {
  const Post: IPostModel = this
  return Post.findOneAndUpdate({ _id }, { $inc: { likesCount: 1 } })
})

postSchema.static("findByCategory", function (category: string) {
  const Post: IPostModel = this
  return Post.find({ categories: category })
})

postSchema.method("editPost", function (_id: mongoose.Types.ObjectId, body: PostQuery) {
  const Post: IPost = this
  return Post.updateOne({ $set: body })
})

const postModel: IPostModel = mongoose.model<IPost, IPostModel>('posts', postSchema)

export default postModel



