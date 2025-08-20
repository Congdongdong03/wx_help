import Taro from "@tarojs/taro";
import store from "../store";
import { selectCurrentUser } from "../store/user/selectors";

// 获取当前用户ID（从Redux状态）
function getCurrentUserId(): string {
  try {
    const state = store.getState();
    const currentUser = selectCurrentUser(state);
    return currentUser?.openid || "dev_openid_123";
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return "dev_openid_123";
  }
}

interface RequestOptions extends Omit<Taro.request.Option, "url"> {
  retryCount?: number;
  retryDelay?: number;
  retryableStatusCodes?: number[];
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
 * 带重试机制的网络请求（使用Redux状态管理）
 */
export async function requestWithRedux<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    retryCount = DEFAULT_RETRY_CONFIG.retryCount,
    retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
    retryableStatusCodes = DEFAULT_RETRY_CONFIG.retryableStatusCodes,
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
          "x-openid": getCurrentUserId(),
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
 * 带重试机制的上传文件（使用Redux状态管理）
 */
export async function uploadFileWithRedux<T = any>(
  url: string,
  filePath: string,
  options: Omit<Taro.uploadFile.Option, "url" | "filePath"> & {
    retryCount?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const {
    retryCount = DEFAULT_RETRY_CONFIG.retryCount,
    retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
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
          "x-openid": getCurrentUserId(),
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
