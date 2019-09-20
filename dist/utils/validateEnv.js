"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envalid_1 = require("envalid");
function validateEnv() {
    envalid_1.cleanEnv(process.env, {
        APP_NAME: envalid_1.str(),
        APP_MAINTAINER: envalid_1.str(),
        APP_HOST: envalid_1.str(),
        APP_PORT: envalid_1.port(),
        CLOUDINARY_CLOUD_NAME: envalid_1.str(),
        CLOUDINARY_API_KEY: envalid_1.str(),
        CLOUDINARY_API_SECRET: envalid_1.str(),
        FIREBASE_TYPE: envalid_1.str(),
        FIREBASE_PROJECT_ID: envalid_1.str(),
        FIREBASE_PRIVATE_KEY_ID: envalid_1.str(),
        FIREBASE_PRIVATE_KEY: envalid_1.str(),
        FIREBASE_CLIENT_EMAIL: envalid_1.str(),
        FIREBASE_CLIENT_ID: envalid_1.str(),
        FIREBASE_AUTH_URI: envalid_1.str(),
        FIREBASE_TOKEN_URI: envalid_1.str(),
        FIREBASE_AUTH_PROVIDER_X509_CERT_URL: envalid_1.str(),
        FIREBASE_CLIENT_X509_CERT_URL: envalid_1.str(),
        FIREBASE_DATABASEURL: envalid_1.str(),
        EMAIL_USER: envalid_1.str(),
        EMAIL_PASS: envalid_1.str(),
        EMAIL_SERVICE: envalid_1.str(),
        EMAIL_HOST: envalid_1.str(),
        MONGODB_ATLAS: envalid_1.str(),
        MONGODB_LOCAL: envalid_1.str(),
        REDIS_HOST: envalid_1.str(),
        REDIS_PORT: envalid_1.port(),
        REDIS_POINTS: envalid_1.str(),
        REDIS_DURATION: envalid_1.str(),
        TOKEN_SECRET: envalid_1.str(),
        TOKEN_REFRESH_SECRET: envalid_1.str(),
        TOKEN_LIFE: envalid_1.str(),
        TOKEN_REFRESH_LIFE: envalid_1.str(),
    });
}
exports.default = validateEnv;
//# sourceMappingURL=validateEnv.js.map