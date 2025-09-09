import Taro from "@tarojs/taro";
import store from "../store";
import { selectCurrentUser } from "../store/user/selectors";

// 用户ID获取策略枚举
export enum UserIdStrategy {
  STORAGE = "storage", // 从本地存储获取
  REDUX = "redux", // 从Redux状态获取
}

// 获取当前用户ID的统一方法
function getCurrentUserId(
  strategy: UserIdStrategy = UserIdStrategy.REDUX
): string {
  try {
    if (strategy === UserIdStrategy.REDUX) {
      // 优先从Redux状态获取
      const state = store.getState();
      const currentUser = selectCurrentUser(state);
      if (currentUser?.openid) {
        return currentUser.openid;
      }
    }

    // 回退到本地存储
    const storedOpenId = Taro.getStorageSync("openid");
    if (process.env.NODE_ENV === "development") {
      return storedOpenId || "dev_openid_123";
    }
    return storedOpenId || "";
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return process.env.NODE_ENV === "development" ? "dev_openid_123" : "";
  }
}

interface RequestOptions extends Omit<Taro.request.Option, "url"> {
  retryCount?: number;
  retryDelay?: number;
  retryableStatusCodes?: number[];
  userIdStrategy?: UserIdStrategy;
}

interface RetryConfig {
  retryCount: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retryCount: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * 延迟函数
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 带重试机制的网络请求
 * @param url 请求URL
 * @param options 请求选项
 * @param userIdStrategy 用户ID获取策略，默认为Redux
 */
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    retryCount = DEFAULT_RETRY_CONFIG.retryCount,
    retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
    retryableStatusCodes = DEFAULT_RETRY_CONFIG.retryableStatusCodes,
    userIdStrategy = UserIdStrategy.REDUX,
    ...requestOptions
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= retryCount) {
    try {
      const response = await Taro.request({
        url,
        ...requestOptions,
        header: {
          ...(requestOptions.header || {}),
          "x-openid": getCurrentUserId(userIdStrategy),
        },
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data as T;
      }

      if (retryableStatusCodes.includes(response.statusCode)) {
        lastError = new Error(
          `HTTP ${response.statusCode}: ${response.data?.message || "请求失败"}`
        );
        attempt++;
        if (attempt <= retryCount) {
          await delay(retryDelay);
          continue;
        }
      }

      throw new Error(
        `HTTP ${response.statusCode}: ${response.data?.message || "请求失败"}`
      );
    } catch (error: any) {
      lastError = error;
      if (
        error.errMsg?.includes("request:fail") ||
        error.errMsg?.includes("timeout")
      ) {
        attempt++;
        if (attempt <= retryCount) {
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
 * 带重试机制的上传文件
 * @param url 上传URL
 * @param filePath 文件路径
 * @param options 上传选项
 * @param userIdStrategy 用户ID获取策略，默认为Redux
 */
export async function uploadFile<T = any>(
  url: string,
  filePath: string,
  options: Omit<Taro.uploadFile.Option, "url" | "filePath"> & {
    retryCount?: number;
    retryDelay?: number;
    userIdStrategy?: UserIdStrategy;
  } = {}
): Promise<T> {
  const {
    retryCount = DEFAULT_RETRY_CONFIG.retryCount,
    retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
    userIdStrategy = UserIdStrategy.REDUX,
    ...uploadOptions
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= retryCount) {
    try {
      const response = await Taro.uploadFile({
        url,
        filePath,
        ...uploadOptions,
        header: {
          ...(uploadOptions.header || {}),
          "x-openid": getCurrentUserId(userIdStrategy),
        },
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return JSON.parse(response.data) as T;
      }

      if (
        DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(response.statusCode)
      ) {
        lastError = new Error(
          `HTTP ${response.statusCode}: ${response.data || "上传失败"}`
        );
        attempt++;
        if (attempt <= retryCount) {
          await delay(retryDelay);
          continue;
        }
      }

      throw new Error(
        `HTTP ${response.statusCode}: ${response.data || "上传失败"}`
      );
    } catch (error: any) {
      lastError = error;
      if (
        error.errMsg?.includes("uploadFile:fail") ||
        error.errMsg?.includes("timeout")
      ) {
        attempt++;
        if (attempt <= retryCount) {
          await delay(retryDelay);
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

// 为了向后兼容，导出旧的函数名
export const requestWithRedux = request;
export const uploadFileWithRedux = uploadFile;
