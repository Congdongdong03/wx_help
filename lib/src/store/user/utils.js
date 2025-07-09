"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserInfo = exports.saveUserToken = exports.getUserToken = exports.checkUserLoginStatus = exports.clearUserFromStorage = exports.saveUserToStorage = exports.getUserFromStorage = void 0;
const taro_1 = require("@tarojs/taro");
// 存储键名
const USER_STORAGE_KEY = "userInfo";
const TOKEN_STORAGE_KEY = "userToken";
/**
 * 从本地存储获取用户信息
 */
const getUserFromStorage = () => {
    try {
        const userInfo = taro_1.default.getStorageSync(USER_STORAGE_KEY);
        if (userInfo && userInfo.openid) {
            console.log("从本地存储获取用户信息:", userInfo);
            return userInfo;
        }
    }
    catch (error) {
        console.error("从本地存储获取用户信息失败:", error);
    }
    return null;
};
exports.getUserFromStorage = getUserFromStorage;
/**
 * 将用户信息保存到本地存储
 */
const saveUserToStorage = (userInfo) => {
    try {
        taro_1.default.setStorageSync(USER_STORAGE_KEY, userInfo);
        console.log("用户信息已保存到本地存储:", userInfo);
    }
    catch (error) {
        console.error("保存用户信息到本地存储失败:", error);
    }
};
exports.saveUserToStorage = saveUserToStorage;
/**
 * 从本地存储清除用户信息
 */
const clearUserFromStorage = () => {
    try {
        taro_1.default.removeStorageSync(USER_STORAGE_KEY);
        taro_1.default.removeStorageSync(TOKEN_STORAGE_KEY);
        console.log("用户信息已从本地存储清除");
    }
    catch (error) {
        console.error("清除本地存储用户信息失败:", error);
    }
};
exports.clearUserFromStorage = clearUserFromStorage;
/**
 * 检查用户登录状态
 */
const checkUserLoginStatus = () => {
    const userInfo = (0, exports.getUserFromStorage)();
    return !!userInfo && !!userInfo.openid;
};
exports.checkUserLoginStatus = checkUserLoginStatus;
/**
 * 获取用户Token
 */
const getUserToken = () => {
    try {
        const token = taro_1.default.getStorageSync(TOKEN_STORAGE_KEY);
        return token || null;
    }
    catch (error) {
        console.error("获取用户Token失败:", error);
        return null;
    }
};
exports.getUserToken = getUserToken;
/**
 * 保存用户Token
 */
const saveUserToken = (token) => {
    try {
        taro_1.default.setStorageSync(TOKEN_STORAGE_KEY, token);
        console.log("用户Token已保存");
    }
    catch (error) {
        console.error("保存用户Token失败:", error);
    }
};
exports.saveUserToken = saveUserToken;
/**
 * 验证用户信息完整性
 */
const validateUserInfo = (userInfo) => {
    return (userInfo &&
        typeof userInfo === "object" &&
        (typeof userInfo.id === "string" || typeof userInfo.id === "number") &&
        typeof userInfo.openid === "string" &&
        typeof userInfo.nickName === "string");
};
exports.validateUserInfo = validateUserInfo;
//# sourceMappingURL=utils.js.map