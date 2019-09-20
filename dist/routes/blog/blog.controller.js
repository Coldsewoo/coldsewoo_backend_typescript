"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const admin = require("firebase-admin");
const utils_1 = require("../../utils/utils");
const user_model_1 = require("../users/user.model");
const firebaseConfig_1 = require("../../config/firebaseConfig");
const ExceptionLogger_1 = require("../../exceptions/ExceptionLogger");
const HttpException_1 = require("../../exceptions/HttpException");
const HttpAuthException_1 = require("../../exceptions/HttpAuthException");
class BlogController {
    constructor() {
        this.path = "/blog";
        this.router = express.Router();
        this.User = user_model_1.default;
        this.postsRef = firebaseConfig_1.default.collection("posts");
        this.categoriesRef = firebaseConfig_1.default.collection("categories");
        this.getArticles = async (req, res, next) => {
            try {
                const doc = await this.postsRef.get();
                const result = [];
                doc.docs.forEach((item) => {
                    result.push(item.data());
                });
                res.json(result);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("blogController.getArticles", err));
            }
        };
        this.postArticle = async (req, res, next) => {
            try {
                const payload = Object.assign({ username: req.decoded.username, comments: [] }, req.body);
                const User = await this.User.findOne({ username: req.decoded.username });
                payload.headImageURL = User.avatar;
                payload.nickname = User.nickname;
                const today = this.getToday();
                const articles = await this.postsRef.where("created", "==", today).get();
                let articlesLength = articles.docs.length;
                articlesLength = this.pad(articlesLength + 1, 3);
                const articleId = payload.articleId ? payload.articleId : `${today}${articlesLength}`;
                payload.articleId = articleId;
                const categoryItem = payload.categories;
                const categorySplit = categoryItem.split("/");
                payload.categories = {
                    path: categoryItem,
                    tab: categorySplit[0] ? categorySplit[0] : categoryItem,
                    menu: categorySplit[1] ? categorySplit[1] : null,
                    submenu: categorySplit[2] ? categorySplit[2] : null,
                };
                if (payload.status === "edit") {
                    const doc = await this.postsRef.doc(payload.articleId).get();
                    const images = doc.data().images;
                    payload.images = payload.images.concat(images);
                    payload.comments = doc.data().comments;
                }
                else {
                    payload.created = today;
                }
                await this.postsRef.doc(`${articleId}`).set(payload, { merge: true });
                res.json({
                    path: payload.categories.path,
                    articleId
                });
            }
            catch (err) {
                next(new ExceptionLogger_1.default("blogController.postArticle", err));
            }
        };
        this.getSingleArticle = async (req, res, next) => {
            try {
                const id = req.params.id;
                const doc = await this.postsRef.doc(id).get();
                res.json(doc.data());
            }
            catch (err) {
                next(new ExceptionLogger_1.default("blogController.getSingleArticle", err));
            }
        };
        this.getCategories = async (req, res, next) => {
            try {
                const docs = await this.categoriesRef.orderBy("order").get();
                const returnVal = {};
                docs.forEach((doc) => {
                    returnVal[doc.id] = doc.data();
                });
                res.json(returnVal);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("blogController.getCategories", err));
            }
        };
        this.postCategories = async (req, res, next) => {
            try {
                const payload = req.body;
                const level = payload.level;
                let resultPromise;
                switch (level) {
                    case 1:
                        resultPromise = this.postsRef.where("categories.tab", "==", `${payload.tab}`);
                        break;
                    case 2:
                        resultPromise = this.postsRef
                            .where("categories.tab", "==", `${payload.tab}`)
                            .where("categories.menu", "==", `${payload.menu}`);
                        break;
                    case 3:
                        resultPromise = this.postsRef
                            .where("categories.tab", "==", `${payload.tab}`)
                            .where("categories.menu", "==", `${payload.menu}`)
                            .where("categories.submenu", "==", `${payload.submenu}`);
                        break;
                    default:
                        resultPromise = undefined;
                }
                if (!resultPromise)
                    return next(new HttpException_1.NotFound("Categories"));
                const result = await resultPromise.get();
                const returnArr = [];
                result.docs.forEach((doc) => {
                    returnArr.push(doc.data());
                });
                res.json(returnArr);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("blogController.postCategories", err));
            }
        };
        this.editCategories = async (req, res, next) => {
            try {
                const categoriesRef = this.categoriesRef;
                const postsRef = this.postsRef;
                const queryArr = req.body;
                const authLevel = res.locals.authLevel;
                function categoryEditPromise(arr, index) {
                    return new Promise(async function (resolve, reject) {
                        const query = arr[index];
                        let targetPath;
                        let level;
                        let target;
                        let posts = {};
                        let item = {};
                        const snap = await categoriesRef.get();
                        if (!query.origin) {
                            level = 0;
                        }
                        else {
                            targetPath = query.origin.split("/");
                            level = targetPath.length;
                        }
                        const batch = firebaseConfig_1.default.batch();
                        switch (query.type) {
                            case "add":
                                switch (level) {
                                    case 0:
                                        await categoriesRef.doc(query.name).set({ order: Number(snap.size) });
                                        resolve();
                                        break;
                                    case 1:
                                        item[query.name] = [];
                                        await categoriesRef.doc(targetPath[0]).set(item, { merge: true });
                                        resolve();
                                        break;
                                    case 2:
                                        target = await categoriesRef.doc(targetPath[0]).get();
                                        target = target.data();
                                        target[targetPath[1]].push(query.name);
                                        await categoriesRef.doc(targetPath[0]).set(target, { merge: true });
                                        resolve();
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            case "edit":
                                target = await categoriesRef.doc(targetPath[0]).get();
                                target = target.data();
                                switch (level) {
                                    case 1:
                                        batch.set(categoriesRef.doc(query.name), target);
                                        batch.delete(categoriesRef.doc(targetPath[0]));
                                        posts = await postsRef.where("categories.tab", "==", targetPath[0]).get();
                                        posts.forEach(function (doc) {
                                            const data = doc.data();
                                            const c = data.categories;
                                            c.tab = query.name;
                                            c.path = `${c.tab}/${c.menu}/${c.submenu}`;
                                            batch.set(postsRef.doc(doc.id), data);
                                        });
                                        await batch.commit();
                                        resolve();
                                        break;
                                    case 2:
                                        target[query.name] = target[targetPath[1]].slice();
                                        delete target[targetPath[1]];
                                        batch.set(categoriesRef.doc(targetPath[0]), target);
                                        posts = await postsRef
                                            .where("categories.tab", "==", targetPath[0])
                                            .where("categories.menu", "==", targetPath[1])
                                            .get();
                                        posts.forEach(function (doc) {
                                            const data = doc.data();
                                            const c = data.categories;
                                            c.menu = query.name;
                                            c.path = `${c.tab}/${c.menu}/${c.submenu}`;
                                            batch.set(postsRef.doc(doc.id), data);
                                        });
                                        await batch.commit();
                                        resolve();
                                        break;
                                    case 3:
                                        posts = await postsRef
                                            .where("categories.tab", "==", targetPath[0])
                                            .where("categories.menu", "==", targetPath[1])
                                            .where("categories.submenu", "==", targetPath[2])
                                            .get();
                                        posts.forEach(function (doc) {
                                            const data = doc.data();
                                            const c = data.categories;
                                            c.submenu = query.name;
                                            c.path = `${c.tab}/${c.menu}/${c.submenu}`;
                                            batch.set(postsRef.doc(doc.id), data);
                                        });
                                        const index = target[targetPath[1]].indexOf(targetPath[2]);
                                        target[targetPath[1]].splice(index, 1, query.name);
                                        batch.set(categoriesRef.doc(targetPath[0]), target);
                                        await batch.commit();
                                        resolve();
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            case "delete":
                                target = await categoriesRef.doc(targetPath[0]).get();
                                target = target.data();
                                switch (level) {
                                    case 1:
                                        batch.delete(categoriesRef.doc(targetPath[0]));
                                        posts = await postsRef.where("categories.tab", "==", targetPath[0]).get();
                                        posts.forEach(function (doc) {
                                            const data = doc.data();
                                            const c = data.categories;
                                            c.tab = "Main";
                                            c.menu = null;
                                            c.submenu = null;
                                            c.path = "Main";
                                            batch.set(postsRef.doc(doc.id), data);
                                        });
                                        await batch.commit();
                                        await categoriesRef
                                            .orderBy("order")
                                            .get()
                                            .then((docs) => {
                                            const items = [];
                                            docs.forEach((doc) => {
                                                if (doc.id !== targetPath[0])
                                                    items.push({ id: doc.id, order: doc.data().order });
                                            });
                                            for (const index in items) {
                                                items[index].order = Number(index);
                                            }
                                            items.forEach((item) => {
                                                categoriesRef.doc(item.id).update({ order: item.order });
                                            });
                                        });
                                        resolve();
                                        break;
                                    case 2:
                                        delete target[targetPath[1]];
                                        batch.set(categoriesRef.doc(targetPath[0]), target);
                                        posts = await postsRef
                                            .where("categories.tab", "==", targetPath[0])
                                            .where("categories.menu", "==", targetPath[1])
                                            .get();
                                        posts.forEach(function (doc) {
                                            const data = doc.data();
                                            const c = data.categories;
                                            c.tab = "Main";
                                            c.menu = null;
                                            c.submenu = null;
                                            c.path = "Main";
                                            batch.set(postsRef.doc(doc.id), data);
                                        });
                                        await batch.commit();
                                        break;
                                    case 3:
                                        item = target[targetPath[1]];
                                        const index = item.indexOf(targetPath[2]);
                                        item.splice(index, 1);
                                        batch.set(categoriesRef.doc(targetPath[0]), target);
                                        posts = await postsRef
                                            .where("categories.tab", "==", targetPath[0])
                                            .where("categories.menu", "==", targetPath[1])
                                            .where("categories.submenu", "==", targetPath[2])
                                            .get();
                                        posts.forEach(function (doc) {
                                            const data = doc.data();
                                            const c = data.categories;
                                            c.tab = "Main";
                                            c.menu = null;
                                            c.submenu = null;
                                            c.path = "Main";
                                            batch.set(postsRef.doc(doc.id), data);
                                        });
                                        await batch.commit();
                                        break;
                                    default:
                                        break;
                                }
                                resolve();
                                break;
                            default:
                                reject();
                                break;
                        }
                    });
                }
                async function runner(arr) {
                    try {
                        const promises = [];
                        for (const index in arr) {
                            promises.push(categoryEditPromise(arr, Number(index)));
                        }
                        await Promise.all(promises);
                        return res.sendStatus(200);
                    }
                    catch (err) {
                        next(new ExceptionLogger_1.default("postController.postCategories", err));
                    }
                }
                if (authLevel < 2)
                    return next(new HttpAuthException_1.NoAuthorization());
                runner(queryArr);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("postController.postCategories", err));
            }
        };
        this.deleteArticle = async (req, res, next) => {
            try {
                const id = req.params.id;
                const authLevel = res.locals.authLevel;
                const username = req.decoded.username;
                const tAref = this.postsRef.doc(id);
                const tA = await tAref.get();
                if (!tA.exists)
                    return next(new HttpException_1.NotFound("Article"));
                if (tA.data().username !== username && authLevel < 1)
                    return next(new HttpAuthException_1.NoAuthorization());
                const tAres = await tAref.delete();
                res.json(tAres);
            }
            catch (err) {
                res.json(new ExceptionLogger_1.default("blogController.deleteArticle", err));
            }
        };
        this.renameImages = (req, res, next) => {
            const _id = req.params._id;
            this.postsRef
                .doc(_id)
                .get()
                .then((doc) => {
                const contents = doc.data().content;
                contents.content.forEach((item) => {
                    if (item.content === undefined) {
                        // do nothing
                    }
                    else {
                        for (const index in item.content) {
                            if (item.content[index].type === "image") {
                                item.content[index].attrs.src = item.content[index].attrs.src.replace("temp/", `blog/${_id}/`);
                            }
                        }
                    }
                });
                const images = doc.data().images;
                images.forEach((image) => {
                    for (const key in image)
                        image[key] = image[key].replace("temp/", `blog/${_id}/`);
                });
                return new Promise((resolve, reject) => resolve({ content: contents, image: images }));
            })
                .then((obj) => {
                this.postsRef
                    .doc(_id)
                    .update({
                    content: obj.content,
                    images: obj.image,
                })
                    .then(() => {
                    res.sendStatus(200);
                });
            })
                .catch(err => next(new ExceptionLogger_1.default("blogController.renameImages", err)));
        };
        this.getComments = (req, res, next) => {
            const articleId = req.params.id;
            this.postsRef
                .doc(articleId)
                .get()
                .then((docs) => {
                const comments = docs.data().comments || [];
                res.json(comments);
            })
                .catch(err => next(new ExceptionLogger_1.default("postsController.getComments", err)));
        };
        this.addComment = async (req, res, next) => {
            try {
                const articleId = req.params.id;
                const payload = Object.assign({ username: req.decoded.username }, req.body);
                const User = await this.User.findOne({ username: req.decoded.username });
                payload.userAvatar = User.avatar;
                payload.userNickname = User.nickname;
                payload.created = this.getToday();
                payload.parent = articleId;
                payload._id = [...Array(15)].map(() => Math.random().toString(36)[2]).join("");
                payload.reply = [];
                await this.postsRef.doc(articleId).update({
                    comments: admin.firestore.FieldValue.arrayUnion(payload)
                });
                res.sendStatus(200);
            }
            catch (err) {
                next(new ExceptionLogger_1.default("blogController.addComment", err));
            }
        };
        this.deleteCommentReply = (req, res, next) => {
            const { articleId, commentId, replyId } = req.params;
            const username = req.decoded.username;
            const authLevel = res.locals.authLevel;
            const postsRef = this.postsRef;
            postsRef
                .doc(articleId)
                .get()
                .then((doc) => {
                const comments = doc.data().comments;
                let outerIndex;
                for (let i = 0; i < comments.length; i++) {
                    if (comments[i]._id === commentId)
                        outerIndex = i;
                }
                const comment = comments[outerIndex];
                let innerIndex;
                for (let j = 0; j < comment.reply.length; j++) {
                    if (comment.reply[j]._id === replyId)
                        innerIndex = j;
                }
                comment.reply.splice(innerIndex, 1);
                return new Promise((resolve, reject) => {
                    resolve(comments);
                });
            })
                .then(async (comments) => {
                await postsRef.doc(articleId).update({
                    comments,
                });
                res.sendStatus(200);
            })
                .catch(err => next(new ExceptionLogger_1.default("blogController.deleteCommentReply", err)));
        };
        this.deleteComment = (req, res, next) => {
            const postsRef = this.postsRef;
            const { articleId, commentId } = req.params;
            postsRef
                .doc(articleId)
                .get()
                .then((doc) => {
                const filtered = doc.data().comments.filter((e) => e._id !== commentId);
                return new Promise((resolve, reject) => {
                    resolve(filtered);
                });
            })
                .then(async (filtered) => {
                await postsRef.doc(articleId).update({
                    comments: filtered
                });
                res.sendStatus(200);
            })
                .catch(err => next(new ExceptionLogger_1.default("postsController.deleteComment", err)));
        };
        this.editComment = (req, res, next) => {
            const postsRef = this.postsRef;
            const { articleId, commentId } = req.params;
            postsRef
                .doc(articleId)
                .get()
                .then((doc) => {
                const comments = doc.data().comments;
                for (let i = 0; i < comments.length; i++) {
                    if (comments[i]._id === commentId) {
                        comments[i].message = req.body.message;
                    }
                }
                return new Promise((resolve, reject) => {
                    resolve(comments);
                });
            })
                .then(async (comments) => {
                await postsRef.doc(articleId).update({
                    comments
                });
                res.sendStatus(200);
            })
                .catch(err => next(new ExceptionLogger_1.default("postsController.editComment", err)));
        };
        this.addCommentReply = async (req, res, next) => {
            try {
                const postsRef = this.postsRef;
                const { articleId, commentId } = req.params;
                const payload = Object.assign({ username: req.decoded.username }, req.body, { commentId });
                const User = await this.User.findOne({ username: req.decoded.username });
                payload.userAvatar = User.avatar;
                payload.userNickname = User.nickname;
                payload.created = this.getToday();
                payload.parent = articleId;
                payload._id = [...Array(15)].map(() => Math.random().toString(36)[2]).join("");
                return new Promise((resolve, reject) => {
                    resolve(payload);
                })
                    .then((payload) => {
                    postsRef
                        .doc(articleId)
                        .get()
                        .then(async (doc) => {
                        const comments = doc.data().comments;
                        let index;
                        for (let i = 0; i < comments.length; i++) {
                            if (comments[i]._id === commentId)
                                index = i;
                        }
                        comments[index].reply.push(payload);
                        await postsRef.doc(articleId).update({
                            comments,
                        });
                        res.sendStatus(200);
                    })
                        .catch(err => next(new ExceptionLogger_1.default("postsController.addCommentReply", err)));
                });
            }
            catch (err) {
                next(new ExceptionLogger_1.default("postsController.addCommentReply", err));
            }
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}`, this.getArticles);
        this.router.post(`${this.path}`, utils_1.default.isLoggedin, this.postArticle);
        this.router.get(`${this.path}/articles/:id`, this.getSingleArticle);
        this.router.get(`${this.path}/categories`, this.getCategories);
        this.router.post(`${this.path}/categories`, this.postCategories);
        this.router.put(`${this.path}/categories`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.editCategories);
        this.router.delete(`${this.path}/articles/:id`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.deleteArticle);
        this.router.put(`${this.path}/rename/:_id`, utils_1.default.isLoggedin, this.renameImages);
        this.router.get(`${this.path}/comments/:id`, this.getComments);
        this.router.post(`${this.path}/comments/:id`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.addComment);
        this.router.delete(`${this.path}/comments/:articleId/:commentId/:replyId`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.deleteCommentReply);
        this.router.delete(`${this.path}/comments/:articleId/:commentId`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.deleteComment);
        this.router.put(`${this.path}/comments/:articleId/:commentId`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.editComment);
        this.router.post(`${this.path}/comments/:articleId/:commentId`, utils_1.default.isLoggedin, utils_1.default.authLevel, this.addCommentReply);
    }
    getToday() {
        const date = new Date();
        const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(-2)}${`0${date.getDate()}`.slice(-2)}`;
        return today;
    }
    pad(n, width) {
        let nStr = n + "";
        return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join("0") + nStr;
    }
}
exports.default = BlogController;
//# sourceMappingURL=blog.controller.js.map