"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const mongoose = require("mongoose");
const ExceptionLogger_1 = require("../../exceptions/ExceptionLogger");
const HttpException_1 = require("../../exceptions/HttpException");
const HttpAuthException_1 = require("../../exceptions/HttpAuthException");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const utils_1 = require("../../utils/utils");
const user_model_1 = require("../users/user.model");
const post_dto_1 = require("./post.dto");
const post_model_1 = require("./post.model");
class PostsController {
    constructor() {
        this.path = '/posts';
        this.router = express.Router();
        this.Post = post_model_1.default;
        this.User = user_model_1.default;
        this.getAllPosts = async (req, res, next) => {
            try {
                const posts = await this.Post.find();
                res.send(posts);
            }
            catch (err) {
                next(new ExceptionLogger_1.default('postController.getAllPosts', err));
            }
        };
        this.getPostById = async (req, res, next) => {
            try {
                const _id = mongoose.Types.ObjectId(req.params._id);
                const post = await this.Post.findOne({ _id: _id });
                if (post) {
                    res.send(post);
                }
                else {
                    next(new HttpException_1.NotFound('Post'));
                }
            }
            catch (err) {
                next(new ExceptionLogger_1.default('postController.getPostById', err));
            }
        };
        this.createPost = async (req, res, next) => {
            try {
                const postData = req.body;
                const user = await this.User.findOne({ username: req.decoded.username });
                const body = Object.assign({}, postData, { username: user.username, userNickname: user.nickname, userAvatar: user.avatar });
                const result = await this.Post.createPost(body);
                res.json(result);
            }
            catch (err) {
                console.log(err);
                next(new ExceptionLogger_1.default("postController.createPost", err));
            }
        };
        this.addComment = async (req, res, next) => {
            try {
                const decoded = req.decoded;
                const body = req.body;
                const user = await this.User.findOne({ username: decoded.username });
                const result = await this.Post.addComment(body, user);
                res.json(result);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("postController.addComment", err));
            }
        };
        this.deleteComment = async (req, res, next) => {
            try {
                const decoded = req.decoded;
                const authLevel = res.locals.authLevel;
                const postId = mongoose.Types.ObjectId(req.body.post_id);
                const commentId = mongoose.Types.ObjectId(req.params._id);
                const post = await this.Post.findOne({ _id: postId });
                if (!post)
                    return next(new HttpException_1.NotFound("Post"));
                if (decoded.username !== post.username && authLevel < 1)
                    return next(new HttpAuthException_1.NoAuthorization());
                const deleteRes = await post.updateOne({
                    $pull: { comments: { _id: commentId } }
                }, function (err, doc) {
                    console.log(doc);
                    if (err)
                        return next(new ExceptionLogger_1.default("postController.deleteComment", err));
                });
                res.json(deleteRes);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("postController.deleteComment", err));
            }
        };
        this.deletePost = (req, res, next) => {
            try {
                const postId = mongoose.Types.ObjectId(req.params._id);
                const authLevel = res.locals.authLevel;
                const username = req.decoded.username;
                this.Post.findOne({ _id: postId }).exec((err, post) => {
                    if (err)
                        return next(new ExceptionLogger_1.default("postController.deletePost", err));
                    if (!post)
                        return next(new HttpException_1.NotFound("Post"));
                    if (username === post.username || authLevel > 0) {
                        post.remove((err, result) => {
                            if (err)
                                return next(new ExceptionLogger_1.default("postController.deletePost", err));
                            res.json(result);
                        });
                    }
                    else
                        return next(new HttpAuthException_1.NoAuthorization());
                });
            }
            catch (err) {
                next(new ExceptionLogger_1.default("postController.deletePost", err));
            }
        };
        this.updateLikesById = (req, res, next) => {
            const _id = mongoose.Types.ObjectId(req.params._id);
            this.Post
                .likesPress(_id)
                .then((updated) => {
                res.json(updated);
            }).catch((err) => {
                next(new ExceptionLogger_1.default("postController.getLikesById", err));
            });
        };
        this.searchCategory = (req, res, next) => {
            const category = req.params.category.toLowerCase();
            this.Post
                .findByCategory(category)
                .then(function (msgs) {
                res.json(msgs);
            })
                .catch((err) => {
                next(new ExceptionLogger_1.default("postController.searchCategory", err));
            });
        };
        this.modifyPost = async (req, res, next) => {
            try {
                const username = req.decoded.username;
                const body = req.body;
                const _id = mongoose.Types.ObjectId(req.params._id);
                const post = await this.Post.findOne({ _id });
                if (!post) {
                    return next(new HttpException_1.NotFound("Post"));
                }
                if (username === post.username) {
                    post
                        .editPost(_id, body)
                        .then(function () {
                        res.sendStatus(200);
                    })
                        .catch((err) => {
                        next(new ExceptionLogger_1.default("postController.modifyPost", err));
                    });
                }
                else {
                    next(new HttpAuthException_1.NoAuthorization());
                }
            }
            catch (err) {
                next(new ExceptionLogger_1.default("postController.modifyPost", err));
            }
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(this.path, this.getAllPosts);
        this.router.get(`${this.path}/:_id`, this.getPostById);
        this.router.post(this.path, utils_1.default.isLoggedin, validation_middleware_1.default(post_dto_1.default), this.createPost);
        this.router.post(`${this.path}/comments`, utils_1.default.isLoggedin, this.addComment);
        this.router.delete(`${this.path}/comments/:_id`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.deleteComment);
        this.router.delete(`${this.path}/:_id`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.deletePost);
        this.router.get(`${this.path}/:_id/like`, this.updateLikesById);
        this.router.get(`${this.path}/search/:category`, this.searchCategory);
        this.router.put(`${this.path}/:_id`, utils_1.default.isLoggedin, utils_1.default.authLevel, validation_middleware_1.default(post_dto_1.default, true), this.modifyPost);
    }
}
exports.default = PostsController;
//# sourceMappingURL=post.controller.js.map