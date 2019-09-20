import morgan = require('morgan')
import bodyParser = require('body-parser')
import express = require('express')
import redis = require('redis')
import mongoose = require("mongoose")
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
    this.initializeControllers(controllers)
    this.connetToDatabase()
    this.initializeErrorHandler()
  }

  public listen() {
    const PORT: number = Number(process.env.PORT) || 5000
    this.app.listen(PORT, () => {
      console.log(`Server listenling on the port ${PORT}`)
    })
  }

  private initializeMiddlewares() {
    // CORS setting
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', 'https://coldsewoo.com')
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Content-Length, x-access-token, Accept,Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
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
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(bodyParser.json())
    this.initilizeRateLimiterRedis()
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.app.use('/', controller.router)
    })
  }
  private initializeErrorHandler() {
    this.app.use(errorMiddleware)

  }

  private initilizeRateLimiterRedis() {
    const redisClient: redis.RedisClient = redis.createClient(redisConfig)
    redisClient.on('connect', () => {
      console.log('Connected to Redis')
    })
    const rateLimiterRedis: RateLimiterRedis = new RateLimiterRedis({
      storeClient: redisClient,
      points: redisConfig.points,
      duration: redisConfig.duration,
    })

    const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
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
    (<any>mongoose).Promise = global.Promise
    mongoose.set("useCreateIndex", true)
    mongoose.set("useFindAndModify", false)
    const MONGO_URI = process.env.MONGODB_ATLAS
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    const mongodb = mongoose.connection
    mongodb.once("open", function () {
      console.log(`Mongoose connected!`)
    })
  }
}
