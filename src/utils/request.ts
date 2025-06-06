import Taro from "@tarojs/taro";

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
 * @param ms 延迟时间（毫秒）
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 带重试机制的网络请求
 * @param url 请求地址
 * @param options 请求配置
 */
export async function request<T = any>(
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
          console.log(`请求失败，${retryDelay}ms后进行第${attempt}次重试...`);
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
 * 带重试机制的上传文件
 * @param url 上传地址
 * @param filePath 文件路径
 * @param options 上传配置
 */
export async function uploadFile<T = any>(
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
          console.log(`上传失败，${retryDelay}ms后进行第${attempt}次重试...`);
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
