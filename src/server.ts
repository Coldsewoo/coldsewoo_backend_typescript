import 'dotenv/config'
import 'reflect-metadata'
import validateEnv from './utils/validateEnv'
import App from './app'
import postsController from './routes/posts/post.controller'
import UsersController from "./routes/users/user.controller"
import AuthContoller from "./routes/auth/auth.controller"
import ImageController from "./routes/images/image.controller"
import BlogController from "./routes/blog/blog.controller"
import CurrencyController from "./routes/currency/currency.controller"

// TypeORM for the Postgres (if needed later)
//  import { createConnection } from 'typeorm'
//  import ormConfig from './config/ormconfig'

// dotenv validation
validateEnv();
(async () => {
  try {
    require('events').EventEmitter.prototype._maxListeners = Infinity;
    // will do something async works before listening to the PORT if needed
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  const app = new App([
    new AuthContoller(),
    new UsersController(),
    new postsController(),
    new ImageController(),
    new BlogController(),
    new CurrencyController()
  ])
  app.listen()
})()
