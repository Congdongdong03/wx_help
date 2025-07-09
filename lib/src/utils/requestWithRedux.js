"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestWithRedux = requestWithRedux;
exports.uploadFileWithRedux = uploadFileWithRedux;
const taro_1 = require("@tarojs/taro");
const store_1 = require("../store");
const selectors_1 = require("../store/user/selectors");
// 获取当前用户ID（从Redux状态）
function getCurrentUserId() {
    try {
        const state = store_1.default.getState();
        const openid = (0, selectors_1.selectUserOpenid)(state);
        return openid || "dev_openid_123";
    }
    catch (error) {
        console.error("获取用户信息失败:", error);
        return "dev_openid_123";
    }
}
const DEFAULT_RETRY_CONFIG = {
    retryCount: 3,
    retryDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};
/**
 * 延迟函数
 * @param ms 延迟时间（毫秒）
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * 带重试机制的网络请求（使用Redux状态管理）
 * @param url 请求地址
 * @param options 请求配置
 */
async function requestWithRedux(url, options = {}) {
    var _a, _b, _c, _d;
    const { retryCount = DEFAULT_RETRY_CONFIG.retryCount, retryDelay = DEFAULT_RETRY_CONFIG.retryDelay, retryableStatusCodes = DEFAULT_RETRY_CONFIG.retryableStatusCodes } = options, requestOptions = __rest(options, ["retryCount", "retryDelay", "retryableStatusCodes"]);
    let lastError;
    let attempt = 0;
    while (attempt <= retryCount) {
        try {
            const response = await taro_1.default.request(Object.assign(Object.assign({ url }, requestOptions), { header: Object.assign(Object.assign({}, (requestOptions.header || {})), { "x-openid": getCurrentUserId() }) }));
            if (response.statusCode >= 200 && response.statusCode < 300) {
                return response.data;
            }
            if (retryableStatusCodes.includes(response.statusCode)) {
                lastError = new Error(`HTTP ${response.statusCode}: ${((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || "请求失败"}`);
                attempt++;
                if (attempt <= retryCount) {
                    console.log(`请求失败，${retryDelay}ms后进行第${attempt}次重试...`);
                    await delay(retryDelay);
                    continue;
                }
            }
            throw new Error(`HTTP ${response.statusCode}: ${((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) || "请求失败"}`);
        }
        catch (error) {
            lastError = error;
            if (((_c = error.errMsg) === null || _c === void 0 ? void 0 : _c.includes("request:fail")) ||
                ((_d = error.errMsg) === null || _d === void 0 ? void 0 : _d.includes("timeout"))) {
                attempt++;
                if (attempt <= retryCount) {
                    console.log(`网络错误，${retryDelay}ms后进行第${attempt}次重试...`);
                    await delay(retryDelay);
                    continue;
                }
            }
            throw error;
        }
    }
    throw lastError;
}
/**
 * 带重试机制的上传文件（使用Redux状态管理）
 * @param url 上传地址
 * @param filePath 文件路径
 * @param options 上传配置
 */
async function uploadFileWithRedux(url, filePath, options = {}) {
    var _a, _b;
    const { retryCount = DEFAULT_RETRY_CONFIG.retryCount, retryDelay = DEFAULT_RETRY_CONFIG.retryDelay } = options, uploadOptions = __rest(options, ["retryCount", "retryDelay"]);
    let lastError;
    let attempt = 0;
    while (attempt <= retryCount) {
        try {
            const response = await taro_1.default.uploadFile(Object.assign(Object.assign({ url,
                filePath }, uploadOptions), { header: Object.assign(Object.assign({}, (uploadOptions.header || {})), { "x-openid": getCurrentUserId() }) }));
            if (response.statusCode >= 200 && response.statusCode < 300) {
                return JSON.parse(response.data);
            }
            if (DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(response.statusCode)) {
                lastError = new Error(`HTTP ${response.statusCode}: ${response.data || "上传失败"}`);
                attempt++;
                if (attempt <= retryCount) {
                    console.log(`上传失败，${retryDelay}ms后进行第${attempt}次重试...`);
                    await delay(retryDelay);
                    continue;
                }
            }
            throw new Error(`HTTP ${response.statusCode}: ${response.data || "上传失败"}`);
        }
        catch (error) {
            lastError = error;
            if (((_a = error.errMsg) === null || _a === void 0 ? void 0 : _a.includes("uploadFile:fail")) ||
                ((_b = error.errMsg) === null || _b === void 0 ? void 0 : _b.includes("timeout"))) {
                attempt++;
                if (attempt <= retryCount) {
                    console.log(`网络错误，${retryDelay}ms后进行第${attempt}次重试...`);
                    await delay(retryDelay);
                    continue;
                }
            }
            throw error;
        }
    }
    throw lastError;
}
//# sourceMappingURL=requestWithRedux.js.map