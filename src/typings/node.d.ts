declare namespace NodeJS {
  interface Process {

  }

  export interface ProcessEnv {
    APP_NAME: string,
    APP_MAINTAINER: string,
    APP_HOST: string,
    APP_PORT: string,
    CLOUDINARY_CLOUD_NAME: string,
    CLOUDINARY_API_KEY: string,
    CLOUDINARY_API_SECRET: string,
    FIREBASE_TYPE: string,
    FIREBASE_PROJECT_ID: string,
    FIREBASE_PRIVATE_KEY_ID: string,
    FIREBASE_PRIVATE_KEY: string,
    FIREBASE_CLIENT_EMAIL: string,
    FIREBASE_CLIENT_ID: string,
    FIREBASE_AUTH_URI: string,
    FIREBASE_TOKEN_URI: string,
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: string,
    FIREBASE_CLIENT_X509_CERT_URL: string,
    FIREBASE_DATABASEURL: string,
    EMAIL_USER: string,
    EMAIL_PASS: string,
    EMAIL_SERVICE: string,
    EMAIL_HOST: string,
    MONGODB_ATLAS: string,
    MONGODB_LOCAL: string,
    REDIS_HOST: string,
    REDIS_PORT: string,
    REDIS_POINTS: string,
    REDIS_DURATION: string,
    TOKEN_SECRET: string,
    TOKEN_REFRESH_SECRET: string,
    TOKEN_LIFE: string,
    TOKEN_REFRESH_LIFE: string,
  }
}



