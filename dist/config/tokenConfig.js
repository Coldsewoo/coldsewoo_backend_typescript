"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenConfig = {
    tokenSecret: process.env.TOKEN_SECRET,
    refreshSecret: process.env.TOKEN_REFRESH_SECRET,
    tokenLife: Number(process.env.TOKEN_LIFE),
    refreshTokenLife: Number(process.env.TOKEN_REFRESH_LIFE)
};
exports.default = tokenConfig;
//# sourceMappingURL=tokenConfig.js.map