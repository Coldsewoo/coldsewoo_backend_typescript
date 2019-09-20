"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const validateEnv_1 = require("./utils/validateEnv");
const app_1 = require("./app");
const post_controller_1 = require("./routes/posts/post.controller");
const user_controller_1 = require("./routes/users/user.controller");
const auth_controller_1 = require("./routes/auth/auth.controller");
const image_controller_1 = require("./routes/images/image.controller");
const blog_controller_1 = require("./routes/blog/blog.controller");
const currency_controller_1 = require("./routes/currency/currency.controller");
// TypeORM for the Postgres (if needed later)
//  import { createConnection } from 'typeorm'
//  import ormConfig from './config/ormconfig'
// dotenv validation
validateEnv_1.default();
(async () => {
    try {
        require('events').EventEmitter.prototype._maxListeners = Infinity;
        // will do something async works before listening to the PORT if needed
    }
    catch (err) {
        process.exit(1);
    }
    const app = new app_1.default([
        new auth_controller_1.default(),
        new user_controller_1.default(),
        new post_controller_1.default(),
        new image_controller_1.default(),
        new blog_controller_1.default(),
        new currency_controller_1.default()
    ]);
    app.listen();
})();
//# sourceMappingURL=server.js.map