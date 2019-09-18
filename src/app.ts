import * as cookieParser from 'cookie-parser'
import * as morgan from 'morgan'
import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as redis from 'redis'
import * as mongoose from "mongoose"
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { Request, Response, NextFunction } from 'express'
import Controller from './interfaces/controller.interface'
import errorMiddleware from './middleware/error.middleware'
import redisConfig from './config/redisconfig'
import { TooManyRequests } from './exceptions/HttpException'


export default class App {
  public app: express.Application

  constructor(controllers: Controller[]) {
    this.app = express()

    this.initializeMiddlewares()
    this.initilizeRateLimiterRedis()
    this.initializeControllers(controllers)
    this.initializeErrorHandling()
    this.connetToDatabase()
  }

  public listen() {
    const PORT: number = Number(process.env.PORT) || 5000
    this.app.listen(PORT, () => {
      console.log(`App listenling on the port ${PORT}`)
    })
  }

  private initializeMiddlewares() {
    // CORS setting
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
      res.header(
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin, Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token, Accept,Origin,Access-Control-Request-Method, Access-Control-Request-Headers',
      )
      res.header('Access-Control-Max-Age', '3600')

      // intercept OPTIONS method
      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
      } else {
        next()
      }
    })

    this.app.use(morgan('tiny'))
    this.app.use(cookieParser())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(bodyParser.json())
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router)
    })
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware)
  }

  private initilizeRateLimiterRedis() {
    const redisClient = redis.createClient(redisConfig)
    redisClient.on('connect', () => {
      console.log('Connected to Redis')
    })
    const rateLimiterRedis: RateLimiterRedis = new RateLimiterRedis({
      storeClient: redisClient,
      points: redisConfig.points,
      duration: redisConfig.duration,
    })

    const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
      rateLimiterRedis
        .consume(req.ip)
        .then(() => next())
        .catch((err) => {
          next(new TooManyRequests())
        })
    }
    this.app.use(rateLimiterMiddleware)
  }

  private connetToDatabase = () => {
    mongoose.set("useCreateIndex", true)
    mongoose.set("useFindAndModify", false)
    const MONGO_URI = process.env.MONGODB_LOCAL
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    const mongodb = mongoose.connection
    mongodb.once("open", function () {
      console.log(`Mongoose connected to
       ${MONGO_URI}`)
    })

  }
}
