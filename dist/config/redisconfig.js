"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redisconfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    points: Number(process.env.REDIS_POINTS),
    duration: Number(process.env.REDIS_DURATION),
};
exports.default = redisconfig;
//# sourceMappingURL=redisconfig.js.map