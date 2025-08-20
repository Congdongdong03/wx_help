import Taro from "@tarojs/taro";
import { UserInfo } from "./types";

// 存储键名
const USER_STORAGE_KEY = "userInfo";
const TOKEN_STORAGE_KEY = "userToken";

/**
 * 从本地存储获取用户信息
 */
export const getUserFromStorage = (): UserInfo | null => {
  try {
    const userInfo = Taro.getStorageSync(USER_STORAGE_KEY);
    if (userInfo && userInfo.openid) {
      return userInfo;
    }
  } catch (error) {
    console.error("从本地存储获取用户信息失败:", error);
  }
  return null;
};

/**
 * 将用户信息保存到本地存储
 */
export const saveUserToStorage = (userInfo: UserInfo): void => {
  try {
    Taro.setStorageSync(USER_STORAGE_KEY, userInfo);
  } catch (error) {
    console.error("保存用户信息到本地存储失败:", error);
  }
};

/**
 * 从本地存储清除用户信息
 */
export const clearUserFromStorage = (): void => {
  try {
    Taro.removeStorageSync(USER_STORAGE_KEY);
    Taro.removeStorageSync(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("清除本地存储用户信息失败:", error);
  }
};

/**
 * 检查用户登录状态
 */
export const checkUserLoginStatus = (): boolean => {
  const userInfo = getUserFromStorage();
  return !!userInfo && !!userInfo.openid;
};

/**
 * 获取用户Token
 */
export const getUserToken = (): string | null => {
  try {
    const token = Taro.getStorageSync(TOKEN_STORAGE_KEY);
    return token || null;
  } catch (error) {
    console.error("获取用户Token失败:", error);
    return null;
  }
};

/**
 * 保存用户Token
 */
export const saveUserToken = (token: string): void => {
  try {
    Taro.setStorageSync(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("保存用户Token失败:", error);
  }
};

/**
 * 验证用户信息完整性
 */
export const validateUserInfo = (userInfo: any): userInfo is UserInfo => {
  return (
    userInfo &&
    typeof userInfo === "object" &&
    (typeof userInfo.id === "string" || typeof userInfo.id === "number") &&
    typeof userInfo.openid === "string" &&
    typeof userInfo.nickName === "string"
  );
};
