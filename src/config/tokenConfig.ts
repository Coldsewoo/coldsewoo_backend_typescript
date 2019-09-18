type tokenConfig = {
  tokenSecret: string
  refreshSecret: string
  tokenLife: number
  refreshTokenLife: number
}

const tokenConfig: tokenConfig = {
  tokenSecret: process.env.TOKEN_SECRET,
  refreshSecret: process.env.TOKEN_REFRESH_SECRET,
  tokenLife: Number(process.env.TOKEN_LIFE),
  refreshTokenLife: Number(process.env.TOKEN_REFRESH_LIFE)
}

export default tokenConfig
