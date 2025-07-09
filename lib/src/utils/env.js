"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCAL_IP = exports.ENV = exports.API_PORT = exports.BASE_URL = exports.config = void 0;
// 重新导出主配置文件，保持向后兼容
var env_1 = require("../config/env");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return env_1.config; } });
Object.defineProperty(exports, "BASE_URL", { enumerable: true, get: function () { return env_1.BASE_URL; } });
Object.defineProperty(exports, "API_PORT", { enumerable: true, get: function () { return env_1.API_PORT; } });
Object.defineProperty(exports, "ENV", { enumerable: true, get: function () { return env_1.ENV; } });
Object.defineProperty(exports, "LOCAL_IP", { enumerable: true, get: function () { return env_1.LOCAL_IP; } });
//# sourceMappingURL=env.js.map