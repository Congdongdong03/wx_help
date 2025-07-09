"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONFIG = exports.getBaseUrl = void 0;
const env_1 = require("./env");
// API configuration
const getBaseUrl = () => {
    return env_1.BASE_URL;
};
exports.getBaseUrl = getBaseUrl;
exports.API_CONFIG = {
    BASE_URL: (0, exports.getBaseUrl)(),
    getApiUrl: (path) => `${(0, exports.getBaseUrl)()}/api${path}`,
    getImageUrl: (path) => `${(0, exports.getBaseUrl)()}${path}`,
};
//# sourceMappingURL=api.js.map