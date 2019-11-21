import { ConnectionOptions, DatabaseType } from 'typeorm'

let type: DatabaseType

switch (process.env.TYPEORM_CONNECTION) {
  case "postgres": type = "postgres"; break;
  case "mongodb": type = "mongodb"; break;
  default: type = "postgres";
}

const config: ConnectionOptions = {
  // keepConnectionAlive: true,
  // retryDelay: 1000,
  // retryAttempts: 5,
  type,
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: ["error"],
  logger: "advanced-console",
  entities: [__dirname + '/../**/**/*.entity{.ts,.js}'],
  // Needs to be set false in production
  synchronize: true,
}

export default config
