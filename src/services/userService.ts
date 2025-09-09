import Taro from "@tarojs/taro";
import { request } from "../utils/request";
import { API_CONFIG } from "../config/api";
import { UserInfo } from "../store/user/types";

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 微信登录
   */
  static async wechatLogin(code: string, userInfo: any): Promise<UserInfo> {
    try {
      const response = await request(
        API_CONFIG.getApiUrl("/auth/wechat-login"),
        {
          method: "POST",
          data: {
            code,
            userInfo,
          },
          retryCount: 3,
          retryDelay: 1000,
          retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        }
      );

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
      } else {
        throw new Error(response.message || "登录失败");
      }
    } catch (error) {
      console.error("微信登录失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(): Promise<UserInfo | null> {
    try {
      const response = await request(API_CONFIG.getApiUrl("/users/info"), {
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
      } else {
        throw new Error(response.message || "获取用户信息失败");
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return null;
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(userInfo: Partial<UserInfo>): Promise<boolean> {
    try {
      const response = await request(API_CONFIG.getApiUrl("/users/info"), {
        method: "PUT",
        data: userInfo,
        retryCount: 2,
        retryDelay: 1000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      });

      if (response.code === 0) {
        return true;
      } else {
        throw new Error(response.message || "更新用户信息失败");
      }
    } catch (error) {
      console.error("更新用户信息失败:", error);
      return false;
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<boolean> {
    try {
      const response = await request(API_CONFIG.getApiUrl("/users/logout"), {
        method: "POST",
        retryCount: 1,
        retryDelay: 1000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      });

      if (response.code === 0) {
        return true;
      } else {
        throw new Error(response.message || "登出失败");
      }
    } catch (error) {
      console.error("登出失败:", error);
      return false;
    }
  }

  /**
   * 检查登录状态
   */
  static async checkLoginStatus(): Promise<boolean> {
    try {
      const userInfo = await this.getUserInfo();
      return userInfo !== null;
    } catch (error) {
      console.error("检查登录状态失败:", error);
      return false;
    }
  }
}
