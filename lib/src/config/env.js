"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketServerUrl = exports.SOCKET_SERVER_URL = exports.LOCAL_IP = exports.ENV = exports.API_PORT = exports.BASE_URL = exports.config = void 0;
// 安全获取环境变量
const getEnvVar = (key) => {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
        return process.env[key];
    }
    return undefined;
};
// 智能获取 Socket 服务器地址
const getSmartSocketUrl = () => {
    // 优先使用环境变量
    const envSocketUrl = getEnvVar("REACT_APP_SOCKET_URL");
    if (envSocketUrl) {
        return envSocketUrl;
    }
    // Taro 小程序环境
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Taro = require("@tarojs/taro");
        if (Taro && Taro.getEnv && Taro.getEnv() === "WEAPP") {
            return "ws://192.168.20.18:3000";
        }
    }
    catch (e) { }
    // 微信小程序原生判断
    if (typeof wx !== "undefined" && typeof wx.getSystemInfo === "function") {
        return "ws://192.168.20.18:3000";
    }
    // 微信H5环境
    if (typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        /micromessenger/i.test(navigator.userAgent)) {
        return "ws://192.168.20.18:3000";
    }
    // 浏览器环境自动判断
    if (typeof window !== "undefined") {
        const { hostname } = window.location;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "ws://localhost:3000";
        }
        // 局域网访问
        return "ws://192.168.20.18:3000";
    }
    // Node 环境默认
    return "ws://localhost:3000";
};
// 统一配置（开发和生产都一样）
const baseConfig = {
    BASE_URL: "http://localhost:3000",
    API_PORT: 3000,
    ENV: typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV === "production"
        ? "production"
        : "development",
    LOCAL_IP: "192.168.20.18",
    SOCKET_SERVER_URL: getSmartSocketUrl(),
};
exports.config = baseConfig;
exports.BASE_URL = exports.config.BASE_URL, exports.API_PORT = exports.config.API_PORT, exports.ENV = exports.config.ENV, exports.LOCAL_IP = exports.config.LOCAL_IP, exports.SOCKET_SERVER_URL = exports.config.SOCKET_SERVER_URL;
exports.getSocketServerUrl = getSmartSocketUrl;
//# sourceMappingURL=env.js.map