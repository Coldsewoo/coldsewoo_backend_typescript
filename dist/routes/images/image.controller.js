"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cloudinary_1 = require("cloudinary");
const utils = require("util");
const request = require("request");
const multer_middleware_1 = require("../../middleware/multer.middleware");
const cloudinaryConfig_1 = require("../../config/cloudinaryConfig");
const { api, uploader, cloudinaryConfig, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, } = cloudinaryConfig_1.cldnaryConfig;
const utils_1 = require("../../utils/utils");
const ExceptionLogger_1 = require("../../exceptions/ExceptionLogger");
class ImageController {
    constructor() {
        this.path = '/images';
        this.router = express.Router();
        this.uploadImage = (req, res, next) => {
            try {
                const file = req.body.image;
                return uploader
                    .upload(file, { folder: "vuestagram/" })
                    .then(async function (result) {
                    const thumbnail = await cloudinary_1.v2.url(result.secure_url, {
                        width: 447,
                        crop: "scale",
                    });
                    const response = {
                        image: result.secure_url,
                        pId: result.public_id,
                        thumbnail,
                    };
                    res.json(response);
                })
                    .catch(err => {
                    next(new ExceptionLogger_1.default("imageController.uploadImage", err));
                });
            }
            catch (err) {
                next(new ExceptionLogger_1.default("imageController.uploadImage", err));
            }
        };
        this.deleteImage = (req, res, next) => {
            const id = req.query.imagepId;
            return api
                .delete_resources(id)
                .then(function (result) {
                res.json(result);
            })
                .catch(err => {
                next(new ExceptionLogger_1.default("imageController.deleteImage", err));
            });
        };
        this.uploadBlogImage = (req, res, next) => {
            try {
                const file = req.body.image;
                return uploader
                    .upload(file, { folder: "temp/" })
                    .then(async function (result) {
                    const thumbnail = await cloudinary_1.v2.url(result.public_id, {
                        width: 447,
                        crop: "scale"
                    });
                    const response = {
                        image: result.secure_url,
                        pId: result.public_id,
                        thumbnail,
                    };
                    res.json(response);
                })
                    .catch(err => {
                    next(new ExceptionLogger_1.default("imageController.uploadBlogImage", err));
                });
            }
            catch (err) {
                next(new ExceptionLogger_1.default("imageController.uploadBlogImage", err));
            }
        };
        this.deleteBlogImage = (req, res, next) => {
            const _id = req.params._id;
            const folder = `blog/${_id}`;
            cloudinary_1.v2.api.delete_resources_by_prefix(folder, () => {
                const url = utils.format("https://api.cloudinary.com/v1_1/%s/folders/%s", CLOUDINARY_CLOUD_NAME, folder);
                request.delete(url, {
                    auth: {
                        user: CLOUDINARY_API_KEY,
                        pass: CLOUDINARY_API_SECRET,
                        sendImmediately: false,
                    },
                    json: true
                }, function (error, response, body) {
                    if (error)
                        return next(new ExceptionLogger_1.default("imageController.deleteBlogImage", error));
                    else
                        res.json(body);
                });
            });
        };
        /**
         * move image files from temp/ to blog/_id/ by renaming it
         * @param {String} _id = req.params._id
         * @param {Array} pIdArr = req.body [
         *   @param {String} pId = pIdArr[index]
         * ]
         */
        this.moveBlogImage = (req, res, next) => {
            const _id = req.params._id;
            const pId = req.body.map((e) => e.pId);
            const pIdTo = pId.map((e) => e.replace("temp/", `blog/${_id}/`));
            function renameAsync(index) {
                return new Promise((resolve, reject) => {
                    uploader.rename(pId[index], pIdTo[index], (err, res) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
            const renamePromise = pId.map((_, index) => renameAsync(index));
            Promise.all(renamePromise)
                .then(() => {
                res.sendStatus(200);
            })
                .catch(err => {
                next(new ExceptionLogger_1.default("imageController.moveBlogImage", err));
            });
        };
        this.router.use(cloudinaryConfig);
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}`, utils_1.default.isLoggedin, multer_middleware_1.multerUploads, this.uploadImage);
        this.router.delete(`${this.path}`, utils_1.default.isLoggedin, this.deleteImage);
        this.router.post(`${this.path}/blog`, utils_1.default.isLoggedin, multer_middleware_1.multerUploads, this.uploadBlogImage);
        this.router.delete(`${this.path}/blog/:_id`, utils_1.default.isLoggedin, this.deleteBlogImage);
        this.router.put(`${this.path}/blog/:_id`, utils_1.default.isLoggedin, this.moveBlogImage);
    }
}
exports.default = ImageController;
//# sourceMappingURL=image.controller.js.map