import express = require("express")
import { Request, Response, NextFunction } from "express"
import admin = require("firebase-admin")
import bcrypt = require('bcrypt')


import util from "../../utils/utils"
import userModel, { IUser } from '../users/user.model'
import fireStore from "../../config/firebaseConfig"
import Controller from "interfaces/controller.interface"
import ExceptionLogger from '../../exceptions/ExceptionLogger'
import { RequestWithUser } from "../../interfaces/auth.interface"
import { NotFound } from "../../exceptions/HttpException"
import { NoAuthorization } from "../../exceptions/HttpAuthException"

type QuerySnapShot = FirebaseFirestore.QuerySnapshot
type QueryDocumentSnapshot = FirebaseFirestore.QueryDocumentSnapshot
type Document = FirebaseFirestore.DocumentData
type DocumentSnapshot = FirebaseFirestore.DocumentSnapshot
type commentPayload = {
  userNickname?: string,
  password?: string,
  comment: string,
  articleId: string,
  anonymous: string,
  userAvatar: string,
  created: Date,
  parent: string,
  _id: string,
  reply?: Array<string>,
  username?: string,
  commentId?: string
}

export default class BlogController implements Controller {
  public path = "/blog"
  public router = express.Router()
  private User = userModel
  private postsRef = fireStore.collection("posts")
  private categoriesRef = fireStore.collection("categories")

  constructor() {
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.get(`${this.path}`, this.getArticles)
    this.router.post(`${this.path}`, util.isLoggedin, this.postArticle)
    this.router.get(`${this.path}/articles/:id`, this.getSingleArticle)
    this.router.get(`${this.path}/categories`, this.getCategories)
    this.router.post(`${this.path}/categories`, this.postCategories)
    this.router.put(`${this.path}/categories`, util.isLoggedin, util.authLevel, this.editCategories)
    this.router.delete(`${this.path}/articles/:id`, util.isLoggedin, util.authLevel, this.deleteArticle)
    this.router.put(`${this.path}/rename/:_id`, util.isLoggedin, this.renameImages)
    this.router.get(`${this.path}/comments/:id`, this.getComments)
    this.router.post(`${this.path}/comments/:id`, util.isLoggedin, util.authLevel, this.addComment)
    this.router.delete(`${this.path}/comments/:articleId/:commentId/:replyId`, util.isLoggedin, util.authLevel, this.deleteCommentReply)
    this.router.delete(`${this.path}/comments/:articleId/:commentId`, util.isLoggedin, util.authLevel, this.deleteComment)
    this.router.put(`${this.path}/comments/:articleId/:commentId`, util.isLoggedin, util.authLevel, this.editComment)
    this.router.post(`${this.path}/comments/:articleId/:commentId`, util.isLoggedin, util.authLevel, this.addCommentReply)
  }

  private getArticles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.postsRef.get()
      const result: Document[] = []
      doc.docs.forEach((item: DocumentSnapshot) => {
        result.push(item.data())
      })
      res.json(result.reverse())
    } catch (err) {
      next(new ExceptionLogger("blogController.getArticles", err))
    }
  }

  private postArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())
      const payload = {
        username: req.decoded.username,
        comments: [],
        ...req.body
      }
      const User: IUser = await this.User.findOne({ username: req.decoded.username })
      payload.headImageURL = User.avatar
      payload.nickname = User.nickname
      const today = this.getToday()
      const articles = await this.postsRef.where("created", "==", today).get()
      let articlesLength: string | number = articles.docs.length
      articlesLength = this.pad(articlesLength + 1, 3)
      const articleId: string = payload.articleId ? payload.articleId : `${today}${articlesLength}`
      payload.articleId = articleId
      const categoryItem = payload.categories
      const categorySplit = categoryItem.split("/")
      payload.categories = {
        path: categoryItem,
        tab: categorySplit[0] ? categorySplit[0] : categoryItem,
        menu: categorySplit[1] ? categorySplit[1] : null,
        submenu: categorySplit[2] ? categorySplit[2] : null,
      }
      if (payload.status === "edit") {
        const doc = await this.postsRef.doc(payload.articleId).get()
        const images = doc.data().images
        payload.images = payload.images.concat(images)
        payload.comments = doc.data().comments
      } else {
        payload.created = today
      }
      await this.postsRef.doc(`${articleId}`).set(payload, { merge: true })
      res.json({
        path: payload.categories.path,
        articleId
      })
    } catch (err) {
      next(new ExceptionLogger("blogController.postArticle", err))
    }
  }

  private getSingleArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id
      const doc = await this.postsRef.doc(id).get()
      res.json(doc.data())
    } catch (err) {
      next(new ExceptionLogger("blogController.getSingleArticle", err))
    }
  }

  private getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const docs: QuerySnapShot = await this.categoriesRef.orderBy("order").get()
      const returnVal: any = {}
      docs.forEach((doc: DocumentSnapshot) => {
        returnVal[doc.id] = doc.data()
      })
      res.json(returnVal)
    } catch (err) {
      next(new ExceptionLogger("blogController.getCategories", err))
    }
  }

  private postCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body
      const level: 1 | 2 | 3 = payload.level
      let resultPromise: FirebaseFirestore.Query | undefined
      switch (level) {
        case 1:
          resultPromise = this.postsRef.where("categories.tab", "==", `${payload.tab}`)
          break
        case 2:
          resultPromise = this.postsRef
            .where("categories.tab", "==", `${payload.tab}`)
            .where("categories.menu", "==", `${payload.menu}`)
          break
        case 3:
          resultPromise = this.postsRef
            .where("categories.tab", "==", `${payload.tab}`)
            .where("categories.menu", "==", `${payload.menu}`)
            .where("categories.submenu", "==", `${payload.submenu}`)
          break
        default:
          resultPromise = undefined
      }
      if (!resultPromise) return next(new NotFound("Categories"))
      const result: QuerySnapShot = await resultPromise.get()
      const returnArr: Document[] = []
      result.docs.forEach((doc: DocumentSnapshot) => {
        returnArr.push(doc.data())
      })
      res.json(returnArr.reverse())
    } catch (err) {
      next(new ExceptionLogger("blogController.postCategories", err))
    }
  }

  private editCategories = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())
      const categoriesRef = this.categoriesRef
      const postsRef = this.postsRef
      const queryArr = req.body
      const authLevel = res.locals.authLevel
      function categoryEditPromise(arr: any[], index: number): Promise<any> {
        return new Promise(async function (resolve, reject) {
          const query = arr[index]
          let targetPath: string[]
          let level
          let target
          let posts: any = {}
          let item: any = {}
          const snap: QuerySnapShot = await categoriesRef.get()
          if (!query.origin) {
            level = 0
          } else {
            targetPath = query.origin.split("/")
            level = targetPath.length
          }

          const batch = fireStore.batch()
          switch (query.type) {
            case "add":
              switch (level) {
                case 0:
                  await categoriesRef.doc(query.name).set({ order: Number(snap.size) })
                  resolve()
                  break
                case 1:
                  item[query.name] = []
                  await categoriesRef.doc(targetPath[0]).set(item, { merge: true })
                  resolve()
                  break
                case 2:
                  target = await categoriesRef.doc(targetPath[0]).get()
                  target = target.data()
                  target[targetPath[1]].push(query.name)
                  await categoriesRef.doc(targetPath[0]).set(target, { merge: true })
                  resolve()
                  break
                default:
                  break
              }
              break
            case "edit":
              target = await categoriesRef.doc(targetPath[0]).get()
              target = target.data()
              switch (level) {
                case 1:
                  batch.set(categoriesRef.doc(query.name), target)
                  batch.delete(categoriesRef.doc(targetPath[0]))
                  posts = await postsRef.where("categories.tab", "==", targetPath[0]).get()
                  posts.forEach(function (doc: DocumentSnapshot) {
                    const data = doc.data()
                    const c = data.categories
                    c.tab = query.name
                    c.path = `${c.tab}/${c.menu}/${c.submenu}`
                    batch.set(postsRef.doc(doc.id), data)
                  })
                  await batch.commit()
                  resolve()
                  break
                case 2:
                  target[query.name] = target[targetPath[1]].slice()
                  delete target[targetPath[1]]
                  batch.set(categoriesRef.doc(targetPath[0]), target)
                  posts = await postsRef
                    .where("categories.tab", "==", targetPath[0])
                    .where("categories.menu", "==", targetPath[1])
                    .get()
                  posts.forEach(function (doc: DocumentSnapshot) {
                    const data = doc.data()
                    const c = data.categories
                    c.menu = query.name
                    c.path = `${c.tab}/${c.menu}/${c.submenu}`
                    batch.set(postsRef.doc(doc.id), data)
                  })
                  await batch.commit()
                  resolve()
                  break
                case 3:
                  posts = await postsRef
                    .where("categories.tab", "==", targetPath[0])
                    .where("categories.menu", "==", targetPath[1])
                    .where("categories.submenu", "==", targetPath[2])
                    .get()
                  posts.forEach(function (doc: DocumentSnapshot) {
                    const data = doc.data()
                    const c = data.categories
                    c.submenu = query.name
                    c.path = `${c.tab}/${c.menu}/${c.submenu}`
                    batch.set(postsRef.doc(doc.id), data)
                  })
                  const index = target[targetPath[1]].indexOf(targetPath[2])
                  target[targetPath[1]].splice(index, 1, query.name)
                  batch.set(categoriesRef.doc(targetPath[0]), target)
                  await batch.commit()
                  resolve()
                  break
                default:
                  break
              }
              break
            case "delete":
              target = await categoriesRef.doc(targetPath[0]).get()
              target = target.data()
              switch (level) {
                case 1:
                  batch.delete(categoriesRef.doc(targetPath[0]))
                  posts = await postsRef.where("categories.tab", "==", targetPath[0]).get()
                  posts.forEach(function (doc: DocumentSnapshot) {
                    const data = doc.data()
                    const c = data.categories
                    c.tab = "Main"
                    c.menu = null
                    c.submenu = null
                    c.path = "Main"
                    batch.set(postsRef.doc(doc.id), data)
                  })
                  await batch.commit()
                  await categoriesRef
                    .orderBy("order")
                    .get()
                    .then((docs) => {
                      const items: Document[] = []
                      docs.forEach((doc) => {
                        if (doc.id !== targetPath[0])
                          items.push({ id: doc.id, order: doc.data().order })
                      })
                      for (const index in items) {
                        items[index].order = Number(index)
                      }
                      items.forEach((item) => {
                        categoriesRef.doc(item.id).update({ order: item.order })
                      })
                    })
                  resolve()
                  break
                case 2:
                  delete target[targetPath[1]]
                  batch.set(categoriesRef.doc(targetPath[0]), target)
                  posts = await postsRef
                    .where("categories.tab", "==", targetPath[0])
                    .where("categories.menu", "==", targetPath[1])
                    .get()
                  posts.forEach(function (doc: DocumentSnapshot) {
                    const data = doc.data()
                    const c = data.categories
                    c.tab = "Main"
                    c.menu = null
                    c.submenu = null
                    c.path = "Main"
                    batch.set(postsRef.doc(doc.id), data)
                  })
                  await batch.commit()
                  break
                case 3:
                  item = target[targetPath[1]]
                  const index = item.indexOf(targetPath[2])
                  item.splice(index, 1)
                  batch.set(categoriesRef.doc(targetPath[0]), target)
                  posts = await postsRef
                    .where("categories.tab", "==", targetPath[0])
                    .where("categories.menu", "==", targetPath[1])
                    .where("categories.submenu", "==", targetPath[2])
                    .get()
                  posts.forEach(function (doc: DocumentSnapshot) {
                    const data = doc.data()
                    const c = data.categories
                    c.tab = "Main"
                    c.menu = null
                    c.submenu = null
                    c.path = "Main"
                    batch.set(postsRef.doc(doc.id), data)
                  })
                  await batch.commit()
                  break
                default:
                  break
              }
              resolve()
              break
            default:
              reject()
              break
          }
        })
      }
      async function runner(arr: any[]) {
        try {
          const promises: Promise<any>[] = []
          for (const index in arr) {
            promises.push(categoryEditPromise(arr, Number(index)))
          }
          await Promise.all(promises)
          return res.sendStatus(200)
        }
        catch (err) {
          next(new ExceptionLogger("postController.postCategories", err))
        }
      }
      if (authLevel < 2) return next(new NoAuthorization())
      runner(queryArr)
    } catch (err) {
      next(new ExceptionLogger("postController.postCategories", err))
    }
  }

  private deleteArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if(!req.decoded) return next(new NoAuthorization())
      const id = req.params.id
      const authLevel = res.locals.authLevel
      const username = req.decoded.username
      const tAref = this.postsRef.doc(id)
      const tA: DocumentSnapshot = await tAref.get()
      if (!tA.exists) return next(new NotFound("Article"))
      if (tA.data().username !== username && authLevel < 1) return next(new NoAuthorization())
      const tAres = await tAref.delete()
      res.json(tAres)
    } catch (err) {
      res.json(new ExceptionLogger("blogController.deleteArticle", err))
    }
  }

  private renameImages = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const _id = req.params._id
    if(!req.decoded) return next(new NoAuthorization())
    this.postsRef
      .doc(_id)
      .get()
      .then((doc: DocumentSnapshot) => {
        const contents = doc.data().content
        contents.content.forEach((item: any) => {
          if (item.content === undefined) {
            // do nothing
          } else {
            for (const index in item.content) {
              if (item.content[index].type === "image") {
                item.content[index].attrs.src = item.content[index].attrs.src.replace(
                  "temp/",
                  `blog/${_id}/`,
                )
              }
            }
          }
        })
        const images: any[] = doc.data().images
        images.forEach((image: any) => {
          for (const key in image) image[key] = image[key].replace("temp/", `blog/${_id}/`)
        })
        return new Promise((resolve, reject) => resolve({ content: contents, image: images }))
      })
      .then((obj: any) => {
        this.postsRef
          .doc(_id)
          .update({
            content: obj.content,
            images: obj.image,
          })
          .then(() => {
            res.sendStatus(200)
          })
      })
      .catch(err => {if(err) next(new ExceptionLogger("blogController.renameImages", err))})
  }

  private getComments = (req: Request, res: Response, next: NextFunction) => {
    const articleId = req.params.id
    this.postsRef
      .doc(articleId)
      .get()
      .then((docs: DocumentSnapshot) => {
        const comments: any[] = docs.data().comments || []
        res.json(comments)
      })
      .catch(err => {if(err) next(new ExceptionLogger("postsController.getComments", err))})
  }

  private addComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.id
      const payload:commentPayload = req.body
      if(req.decoded) {
        const User: IUser = await this.User.findOne({ username: req.decoded.username })
        payload.userAvatar = User.avatar
        payload.username = User.username
        payload.userNickname = User.nickname
      } else {
        payload.password = bcrypt.hashSync(payload.password, 10)
        payload.userAvatar = 'https://res.cloudinary.com/coldsewoo/image/upload/v1558868166/Assets/purpleuser_kymtpc.png'
      }

      payload.parent = articleId
      payload._id = [...Array(15)].map(() => Math.random().toString(36)[2]).join("")
      payload.reply = []

      await this.postsRef.doc(articleId).update({
        comments: admin.firestore.FieldValue.arrayUnion(payload)
      })
      res.sendStatus(200)
    } catch (err) {
      next(new ExceptionLogger("blogController.addCommentLoggedin", err))
    }
  }

  private deleteCommentReply = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { articleId, commentId, replyId } = req.params
    const postsRef = this.postsRef
    postsRef
      .doc(articleId)
      .get()
      .then((doc: DocumentSnapshot) => {
        const comments: any[] = doc.data().comments
        let outerIndex: number
        for (let i = 0; i < comments.length; i++) {
          if (comments[i]._id === commentId) outerIndex = i
        }
        const comment: any = comments[outerIndex]
        let innerIndex: number
        for (let j = 0; j < comment.reply.length; j++) {
          if (comment.reply[j]._id === replyId) innerIndex = j
        }
        const reply = comment.reply[innerIndex]
        let hasAuth = false
        if(req.decoded && (req.decoded.username === reply.username || res.locals.authLevel > 1)) hasAuth = true
        else if(bcrypt.compareSync(req.body.password, reply.password)) hasAuth = true
        comment.reply.splice(innerIndex, 1)
        return new Promise((resolve, reject) => {
          if(!hasAuth) {
            next(new NoAuthorization())
            reject()
           }
          resolve(comments)
        })
      })
      .then(async (comments: any) => {
        await postsRef.doc(articleId).update({
          comments,
        })
        res.sendStatus(200)
      })
      .catch(err => {if(err) next(new ExceptionLogger("blogController.deleteCommentReply", err))})
  }

  private deleteComment = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const postsRef = this.postsRef
    const { articleId, commentId } = req.params
    postsRef
      .doc(articleId)
      .get()
      .then((doc: DocumentSnapshot) => {
        const filtered = doc.data().comments.filter((e: any) => e._id !== commentId)
        const comment = doc.data().comments.filter((e:any) => e._id === commentId)[0]
        let hasAuth = false
        if(req.decoded && (req.decoded.username === comment.username || res.locals.authLevel > 1)) hasAuth = true
        else if(bcrypt.compareSync(req.body.password, comment.password)) hasAuth = true
        return new Promise((resolve, reject) => {
          if(!hasAuth) {
            next(new NoAuthorization())
            reject()
           }
          resolve(filtered)
        })
      })
      .then(async (filtered: any) => {
        await postsRef.doc(articleId).update({
          comments: filtered
        })
        res.sendStatus(200)
      })
      .catch(err => {if(err) next(new ExceptionLogger("postsController.deleteComment", err))})
  }

  private editComment = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const {comment , password} = req.body
    const postsRef = this.postsRef
    const { articleId, commentId } = req.params
    postsRef
      .doc(articleId)
      .get()
      .then((doc: DocumentSnapshot) => {
        const comments: any[] = doc.data().comments
        let targetComment:any;
        for (let i = 0; i < comments.length; i++) {
          if (comments[i]._id === commentId) {
            targetComment = comments[i]
          }
        }
        let hasAuth:boolean= false
        if(targetComment.anonymous) {
          if(bcrypt.compareSync(password, targetComment.password)) {
            targetComment.comment = comment
            hasAuth = true
          }
        } else {
          const {username} = req.decoded
          if(username === targetComment.username) {
            targetComment.comment = comment
            hasAuth = true
          }
        }
        return new Promise((resolve, reject) => {
          if(!hasAuth) {
           next(new NoAuthorization())
           reject()
          }
          resolve(comments)
        })
      })
      .then(async (comments: any) => {
        await postsRef.doc(articleId).update({
          comments
        })
        res.sendStatus(200)
      })
      .catch(err => {if(err) next(new ExceptionLogger("postsController.editComment", err))})
  }

  private addCommentReply = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const payload:commentPayload = req.body
      const postsRef = this.postsRef
      const { articleId, commentId } = req.params
 
      if(req.decoded) {
        const User: IUser = await this.User.findOne({ username: req.decoded.username })
        payload.userAvatar = User.avatar
        payload.username = User.username
        payload.userNickname = User.nickname
      } else {
        payload.password = bcrypt.hashSync(payload.password, 10)
        payload.userAvatar = 'https://res.cloudinary.com/coldsewoo/image/upload/v1558868166/Assets/purpleuser_kymtpc.png'
      }

      payload.parent = articleId
      payload._id = [...Array(15)].map(() => Math.random().toString(36)[2]).join("")
      
      return new Promise((resolve, reject) => {
        resolve(payload)
      })
        .then((payload: any) => {
          postsRef
            .doc(articleId)
            .get()
            .then(async (doc: DocumentSnapshot) => {
              const comments = doc.data().comments
              let index: number
              for (let i = 0; i < comments.length; i++) {
                if (comments[i]._id === commentId) index = i
              }
              comments[index].reply.push(payload)
              await postsRef.doc(articleId).update({
                comments,
              })
              res.sendStatus(200)
            })
            .catch(err => {if(err) next(new ExceptionLogger("postsController.addCommentReply", err))})
        })
    } catch (err) {
      next(new ExceptionLogger("postsController.addCommentReply", err))
    }
  }

  private getToday(): string {
    const date = new Date()
    const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(
      -2,
    )}${`0${date.getDate()}`.slice(-2)}`
    return today
  }

  private pad(n: number, width: number): string {
    let nStr = n + ""
    return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join("0") + nStr
  }
}
