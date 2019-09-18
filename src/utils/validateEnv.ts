import { cleanEnv, str, port, bool, num } from 'envalid'

function validateEnv() {
  cleanEnv(process.env, {
    APP_NAME: str(),
    APP_MAINTAINER: str(),
    APP_HOST: str(),
    APP_PORT: port(),
    CLOUDINARY_CLOUD_NAME: str(),
    CLOUDINARY_API_KEY: str(),
    CLOUDINARY_API_SECRET: str(),
    FIREBASE_TYPE: str(),
    FIREBASE_PROJECT_ID: str(),
    FIREBASE_PRIVATE_KEY_ID: str(),
    FIREBASE_PRIVATE_KEY: str(),
    FIREBASE_CLIENT_EMAIL: str(),
    FIREBASE_CLIENT_ID: str(),
    FIREBASE_AUTH_URI: str(),
    FIREBASE_TOKEN_URI: str(),
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str(),
    FIREBASE_CLIENT_X509_CERT_URL: str(),
    FIREBASE_DATABASEURL: str(),
    EMAIL_USER: str(),
    EMAIL_PASS: str(),
    EMAIL_SERVICE: str(),
    EMAIL_HOST: str(),
    MONGODB_ATLAS: str(),
    MONGODB_LOCAL: str(),
    REDIS_HOST: str(),
    REDIS_PORT: port(),
    REDIS_POINTS: str(),
    REDIS_DURATION: str(),
    TOKEN_SECRET: str(),
    TOKEN_REFRESH_SECRET: str(),
    TOKEN_LIFE: str(),
    TOKEN_REFRESH_LIFE: str(),
  })
}

export default validateEnv
