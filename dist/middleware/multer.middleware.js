"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require("multer");
const storage = multer.memoryStorage();
exports.multerUploads = multer({
    storage,
    limits: { fieldSize: 25 * 1024 * 1024 }
}).single("image");
//# sourceMappingURL=multer.middleware.js.map