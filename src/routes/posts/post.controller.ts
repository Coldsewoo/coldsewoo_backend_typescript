import express = require('express')
import mongoose = require("mongoose")
import { NextFunction, Request, Response } from 'express'
import { RequestWithUser } from '../../interfaces/auth.interface'
import ExceptionLogger from '../../exceptions/ExceptionLogger'
import { NotFound } from '../../exceptions/HttpException'
import { NoAuthorization } from '../../exceptions/HttpAuthException'
import Controller from '../../interfaces/controller.interface'
import validationMiddleware from '../../middleware/validation.middleware'
import util from '../../utils/utils'
import userModel, { IUser } from '../users/user.model'
import CreatePostDto from './post.dto'
import postModel, { IPost } from './post.model'
import { CommentQuery, PostQuery } from "./post.interface"


export default class PostsController implements Controller {
  public path = '/posts'
  public router = express.Router()
  private Post = postModel
  private User = userModel
  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get(this.path, this.getAllPosts)
    this.router.get(`${this.path}/:_id`, this.getPostById)
    this.router.post(this.path, util.isLoggedin, validationMiddleware(CreatePostDto), this.createPost)
    this.router.post(`${this.path}/comments`, util.isLoggedin, this.addComment)
    this.router.delete(`${this.path}/comments/:_id`, util.isLoggedin, util.authLevel, this.deleteComment)
    this.router.delete(`${this.path}/:_id`, util.isLoggedin, util.authLevel, this.deletePost)
    this.router.get(`${this.path}/:_id/like`, this.updateLikesById)
    this.router.get(`${this.path}/search/:category`, this.searchCategory)
    this.router.put(`${this.path}/:_id`, util.isLoggedin, util.authLevel, validationMiddleware(CreatePostDto, true), this.modifyPost)
  }

  private getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posts = await this.Post.find()
      res.send(posts)
    } catch (err) {
      next(new ExceptionLogger('postController.getAllPosts', err))
    }
  }

  private getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const _id = mongoose.Types.ObjectId(req.params._id)
      const post = await this.Post.findOne({ _id: _id })
      if (post) {
        res.send(post)
      } else {
        next(new NotFound('Post'))
      }
    } catch (err) {
      next(new ExceptionLogger('postController.getPostById', err))
    }
  }

  private createPost = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())
      const postData: CreatePostDto = req.body
      const user = await this.User.findOne({ username: req.decoded.username })
      const body: PostQuery = {
        ...postData,
        username: user.username,
        userNickname: user.nickname,
        userAvatar: user.avatar
      }
      const result = await this.Post.createPost(body)
      res.json(result)
    } catch (err) {
      next(new ExceptionLogger("postController.createPost", err))
    }
  }

  private addComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())
      const decoded = req.decoded
      const body: CommentQuery = req.body
      const user: IUser = await this.User.findOne({ username: decoded.username })
      const result = await this.Post.addComment(body, user)
      res.json(result)
    } catch (err) {
      next(new ExceptionLogger("postController.addComment", err))
    }
  }

  private deleteComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())
      const decoded = req.decoded
      const authLevel = res.locals.authLevel
      const postId = mongoose.Types.ObjectId(req.body.post_id)
      const commentId = mongoose.Types.ObjectId(req.params._id)
      const post = await this.Post.findOne({ _id: postId })
      if (!post) return next(new NotFound("Post"))
      if (decoded.username !== post.username && authLevel < 1) return next(new NoAuthorization())
      const deleteRes = await post.updateOne(
        {
          $pull: { comments: { _id: commentId } }
        },
        function (err, doc) {
          if (err) return next(new ExceptionLogger("postController.deleteComment", err))
        }
      )
      res.json(deleteRes)
    } catch (err) {
      next(new ExceptionLogger("postController.deleteComment", err))
    }
  }


  private deletePost = (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())

      const postId = mongoose.Types.ObjectId(req.params._id)
      const authLevel = res.locals.authLevel
      const username = req.decoded.username
      this.Post.findOne({ _id: postId }).exec((err: mongoose.NativeError, post: IPost) => {
        if (err) return next(new ExceptionLogger("postController.deletePost", err))
        if (!post) return next(new NotFound("Post"))
        if (username === post.username || authLevel > 0) {
          post.remove((err: any, result: IPost) => {
            if (err) return next(new ExceptionLogger("postController.deletePost", err))
            res.json(result)
          })
        } else return next(new NoAuthorization())
      })
    } catch (err) {
      next(new ExceptionLogger("postController.deletePost", err))
    }
  }

  private updateLikesById = (req: Request, res: Response, next: NextFunction) => {
    const _id: mongoose.Types.ObjectId = mongoose.Types.ObjectId(req.params._id)
    this.Post
      .likesPress(_id)
      .then((updated: IPost) => {
        res.json(updated)
      }).catch((err: any) => {
        next(new ExceptionLogger("postController.getLikesById", err))
      })
  }

  private searchCategory = (req: Request, res: Response, next: NextFunction) => {
    const category: string = req.params.category.toLowerCase()
    this.Post
      .findByCategory(category)
      .then(function (msgs: IPost[]) {
        res.json(msgs)
      })
      .catch((err: any) => {
        next(new ExceptionLogger("postController.searchCategory", err))
      })
  }

  private modifyPost = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())

      const username: string = req.decoded.username
      const body: PostQuery = req.body
      const _id: mongoose.Types.ObjectId = mongoose.Types.ObjectId(req.params._id)
      const post = await this.Post.findOne({ _id })
      if (!post) {
        return next(new NotFound("Post"))
      }
      if (username === post.username) {
        post
          .editPost(_id, body)
          .then(function () {
            res.sendStatus(200)
          })
          .catch((err: any) => {
            next(new ExceptionLogger("postController.modifyPost", err))
          })
      } else {
        next(new NoAuthorization())
      }
    } catch (err) {
      next(new ExceptionLogger("postController.modifyPost", err))
    }
  }
}
