type redisConfig = {
  host: string
  port: number
  points: number
  duration: number
}

const redisconfig: redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  points: 20,
  duration: 1,
}

export default redisconfig
