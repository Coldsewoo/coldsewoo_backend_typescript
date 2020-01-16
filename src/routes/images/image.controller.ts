import express = require("express")
import { Request, Response, NextFunction } from "express"
import { v2 } from "cloudinary"
import utils = require("util")
import request = require("request")

import { multerUploads } from "../../middleware/multer.middleware"
import { cldnaryConfig } from "../../config/cloudinaryConfig"
const {
  api,
  uploader,
  cloudinaryConfig,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} = cldnaryConfig
import util from "../../utils/utils"
import Controller from "../../interfaces/controller.interface"
import ExceptionLogger from "../../exceptions/ExceptionLogger"

export default class ImageController implements Controller {
  public path = '/images'
  public router = express.Router()
  constructor() {
    this.router.use(cloudinaryConfig)
    this.initializeRoutes()
  }

  public initializeRoutes() {
    this.router.post(`${this.path}`, util.isLoggedin, multerUploads, this.uploadImage)
    this.router.delete(`${this.path}`, util.isLoggedin, this.deleteImage)
    this.router.post(`${this.path}/blog`, util.isLoggedin, multerUploads, this.uploadBlogImage)
    this.router.delete(`${this.path}/blog/:_id`, util.isLoggedin, this.deleteBlogImage)
    this.router.put(`${this.path}/blog/:_id`, util.isLoggedin, this.moveBlogImage)
  }

  private uploadImage = (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.body.image
      return uploader
        .upload(file, { folder: "vuestagram/" })
        .then(async function (result) {
          const thumbnail = await v2.url(result.secure_url, {
            width: 447,
            crop: "scale",
          })
          const response = {
            image: result.secure_url,
            pId: result.public_id,
            thumbnail,
          }
          res.json(response)
        })
        .catch(err => {
          next(new ExceptionLogger("imageController.uploadImage", err))
        })
    } catch (err) {
      next(new ExceptionLogger("imageController.uploadImage", err))
    }
  }

  private deleteImage = (req: Request, res: Response, next: NextFunction) => {
    const id = req.query.imagepId
    return api
      .delete_resources(id)
      .then(function (result) {
        res.json(result)
      })
      .catch(err => {
        next(new ExceptionLogger("imageController.deleteImage", err))
      })
  }

  private uploadBlogImage = (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.body.image
      return uploader
        .upload(file, { folder: "temp/" })
        .then(async function (result) {
          const thumbnail = await v2.url(result.public_id, {
            width: 447,
            crop: "scale"
          })
          const response = {
            image: result.secure_url,
            pId: result.public_id,
            thumbnail,
          }
          res.json(response)
        })
        .catch(err => {
          next(new ExceptionLogger("imageController.uploadBlogImage", err))
        })
    } catch (err) {
      next(new ExceptionLogger("imageController.uploadBlogImage", err))
    }
  }

  private deleteBlogImage = (req: Request, res: Response, next: NextFunction) => {
    const _id = req.params._id
    const folder = `blog/${_id}`

    v2.api.delete_resources_by_prefix(folder, () => {
      const url = utils.format("https://api.cloudinary.com/v1_1/%s/folders/%s", CLOUDINARY_CLOUD_NAME, folder)

      request.delete(
        url,
        {
          auth: {
            user: CLOUDINARY_API_KEY,
            pass: CLOUDINARY_API_SECRET,
            sendImmediately: false,
          },
          json: true
        },
        function (error, response, body) {
          if (error) return next(new ExceptionLogger("imageController.deleteBlogImage", error))
          else res.json(body)
        }
      )
    })
  }


  /**
   * move image files from temp/ to blog/_id/ by renaming it
   * @param {String} _id = req.params._id
   * @param {Array} pIdArr = req.body [
   *   @param {String} pId = pIdArr[index]
   * ]
   */
  private moveBlogImage = (req: Request, res: Response, next: NextFunction) => {
    const _id = req.params._id
    const pId: string[] = req.body.map((e: any) => e.pId)
    const pIdTo = pId.map((e) => e.replace("temp/", `blog/${_id}/`))
    function renameAsync(index: number): Promise<any> {
      return new Promise((resolve, reject) => {
        uploader.rename(pId[index], pIdTo[index], (err, res) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
    const renamePromise: Promise<any>[] = pId.map((_: any, index: number) => renameAsync(index))
    Promise.all(renamePromise)
      .then(() => {
        res.sendStatus(200)
      })
      .catch(err => {
        next(new ExceptionLogger("imageController.moveBlogImage", err))
      })
  }
}

