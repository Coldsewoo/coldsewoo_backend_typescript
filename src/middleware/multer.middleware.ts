import * as multer from "multer"

const storage = multer.memoryStorage()
export const multerUploads = multer({
  storage,
  limits: { fieldSize: 25 * 1024 * 1024 }
}).single("image")

