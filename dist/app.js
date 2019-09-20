"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const morgan = require("morgan");
const bodyParser = require("body-parser");
const express = require("express");
const redis = require("redis");
const mongoose = require("mongoose");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const error_middleware_1 = require("./middleware/error.middleware");
const redisconfig_1 = require("./config/redisconfig");
const HttpException_1 = require("./exceptions/HttpException");
class App {
    constructor(controllers) {
        this.connetToDatabase = () => {
            mongoose.Promise = global.Promise;
            mongoose.set("useCreateIndex", true);
            mongoose.set("useFindAndModify", false);
            const MONGO_URI = process.env.MONGODB_ATLAS;
            mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
            const mongodb = mongoose.connection;
            mongodb.once("open", function () {
                console.log(`Mongoose connected!`);
            });
        };
        this.app = express();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.connetToDatabase();
        this.initializeErrorHandler();
    }
    listen() {
        const PORT = Number(process.env.PORT) || 5000;
        this.app.listen(PORT, () => {
            console.log(`Server listenling on the port ${PORT}`);
        });
    }
    initializeMiddlewares() {
        // CORS setting
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', 'https://coldsewoo.com');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, x-access-token, Accept,Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
            res.header('Access-Control-Max-Age', '3600');
            // intercept OPTIONS method
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        this.app.use(morgan('tiny'));
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.initilizeRateLimiterRedis();
    }
    initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }
    initializeErrorHandler() {
        this.app.use(error_middleware_1.default);
    }
    initilizeRateLimiterRedis() {
        const redisClient = redis.createClient(redisconfig_1.default);
        redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });
        const rateLimiterRedis = new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: redisClient,
            points: redisconfig_1.default.points,
            duration: redisconfig_1.default.duration,
        });
        const rateLimiterMiddleware = (req, res, next) => {
            rateLimiterRedis
                .consume(req.ip)
                .then(() => next())
                .catch((err) => {
                next(new HttpException_1.TooManyRequests());
            });
        };
        this.app.use(rateLimiterMiddleware);
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map