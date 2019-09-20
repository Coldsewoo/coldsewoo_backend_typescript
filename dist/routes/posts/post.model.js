"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
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
});
const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userNickname: { type: String, required: true },
    userAvatar: { type: String, required: true },
    likes: [String],
    likesCount: { type: Number },
    likePressed: { type: Boolean },
    created: { type: Number },
    message: { type: String, required: true },
});
postSchema.static("createPost", async function (body) {
    const message = this;
    const post = new message(body);
    const date = new Date();
    const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(-2)}${`0${date.getDate()}`.slice(-2)}`;
    const messageCount = await message.countDocuments({ created: today });
    const postId = pad(messageCount + 1, 3);
    for (let i = 0; i < post.categories.length; i++) {
        post.categories[i] = post.categories[i].toLowerCase();
    }
    post.filter = post.filter || 'normal';
    post.created = Number(today);
    post.likesCount = 0;
    post.likes = [];
    post.id = Number(`${today}${postId}`);
    post.likePressed = false;
    return post.save();
    function pad(n, width) {
        let s = n.toString();
        return s.length >= width ? s : new Array(width - s.length + 1).join('0') + s;
    }
});
postSchema.static("addComment", async function (payload, user) {
    const Post = this;
    const date = new Date();
    const today = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(-2)}${`0${date.getDate()}`.slice(-2)}`;
    const Comment = mongoose.model("comments", commentSchema);
    const comment = new Comment({
        username: user.username,
        userNickname: user.nickname,
        userAvatar: user.avatar,
        likes: [],
        likesCount: 0,
        likesPressed: false,
        created: today,
        message: payload.commentInput,
    });
    const post = await Post.findOne({ _id: payload.post_id });
    post.comments.push(comment);
    return post.save();
});
postSchema.static("likesPress", function (_id) {
    const Post = this;
    return Post.findOneAndUpdate({ _id }, { $inc: { likesCount: 1 } });
});
postSchema.static("findByCategory", function (category) {
    const Post = this;
    return Post.find({ categories: category });
});
postSchema.method("editPost", function (_id, body) {
    const Post = this;
    return Post.updateOne({ $set: body });
});
const postModel = mongoose.model('posts', postSchema);
exports.default = postModel;
//# sourceMappingURL=post.model.js.map