"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const request_1 = require("../utils/request");
const requestWithRedux_1 = require("../utils/requestWithRedux");
const api_1 = require("../config/api");
/**
 * 用户服务类
 */
class UserService {
    /**
     * 微信登录
     */
    static async wechatLogin(code, userInfo) {
        try {
            const response = await (0, request_1.request)(api_1.API_CONFIG.getApiUrl("/auth/wechat-login"), {
                method: "POST",
                data: {
                    code,
                    userInfo,
                },
                retryCount: 3,
                retryDelay: 1000,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            });
            if (response.code === 0) {
                return {
                    id: response.data.id,
                    openid: response.data.openid,
                    nickName: response.data.nickName,
                    avatarUrl: response.data.avatarUrl,
                    gender: response.data.gender,
                    city: response.data.city,
                    province: response.data.province,
                    country: response.data.country,
                    language: response.data.language,
                    status: response.data.status,
                    token: response.data.token || `token_${Date.now()}`,
                };
            }
            else {
                throw new Error(response.message || "登录失败");
            }
        }
        catch (error) {
            console.error("微信登录失败:", error);
            throw error;
        }
    }
    /**
     * 获取用户信息
     */
    static async getUserInfo() {
        try {
            const response = await (0, requestWithRedux_1.requestWithRedux)(api_1.API_CONFIG.getApiUrl("/users/info"), {
                method: "GET",
                retryCount: 2,
                retryDelay: 1000,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            });
            if (response.code === 0) {
                return {
                    id: response.data.id,
                    openid: response.data.openid,
                    nickName: response.data.nickname,
                    avatarUrl: response.data.avatar_url,
                    gender: response.data.gender,
                    city: response.data.city,
                    province: response.data.province,
                    country: response.data.country,
                    language: response.data.language,
                    status: response.data.status,
                };
            }
            else {
                throw new Error(response.message || "获取用户信息失败");
            }
        }
        catch (error) {
            console.error("获取用户信息失败:", error);
            return null;
        }
    }
    /**
     * 更新用户信息
     */
    static async updateUserInfo(userInfo) {
        try {
            const response = await (0, requestWithRedux_1.requestWithRedux)(api_1.API_CONFIG.getApiUrl("/users/info"), {
                method: "PUT",
                data: userInfo,
                retryCount: 2,
                retryDelay: 1000,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            });
            if (response.code === 0) {
                return true;
            }
            else {
                throw new Error(response.message || "更新用户信息失败");
            }
        }
        catch (error) {
            console.error("更新用户信息失败:", error);
            return false;
        }
    }
    /**
     * 用户登出
     */
    static async logout() {
        try {
            const response = await (0, requestWithRedux_1.requestWithRedux)(api_1.API_CONFIG.getApiUrl("/users/logout"), {
                method: "POST",
                retryCount: 1,
                retryDelay: 1000,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            });
            if (response.code === 0) {
                return true;
            }
            else {
                throw new Error(response.message || "登出失败");
            }
        }
        catch (error) {
            console.error("登出失败:", error);
            return false;
        }
    }
    /**
     * 检查登录状态
     * TODO: 实现登录状态检查接口
     */
    static async checkLoginStatus() {
        try {
            // 暂时使用获取用户信息来检查登录状态
            const userInfo = await this.getUserInfo();
            return userInfo !== null;
        }
        catch (error) {
            console.error("检查登录状态失败:", error);
            return false;
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map