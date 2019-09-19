import { v2 } from "cloudinary"
const { api, config, uploader } = v2
import { Request, Response, NextFunction } from "express"

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

type cldnaryConfig = {
  api: typeof v2.api,
  cloudinaryConfig(req: Request, res: Response, next: NextFunction): void,
  uploader: typeof v2.uploader,
  CLOUDINARY_CLOUD_NAME: string,
  CLOUDINARY_API_KEY: string,
  CLOUDINARY_API_SECRET: string

}

const cloudinaryConfig = (req: Request, res: Response, next: NextFunction) => {
  config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  })
  next()
}

export const cldnaryConfig: cldnaryConfig = {
  api,
  cloudinaryConfig,
  uploader,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
}
