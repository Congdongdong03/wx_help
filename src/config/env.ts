// 简化的环境配置（在小程序环境中没有 Node 的 process，需要兜底判断）
const hasProcess = typeof process !== "undefined" && (process as any).env;
const ENV =
  hasProcess && process.env.NODE_ENV === "production"
    ? "production"
    : "development";

// 允许通过环境变量覆盖后端地址，便于真机调试（使用局域网IP）
// 优先级：TARO_APP_API_BASE_URL > API_BASE_URL > 默认值
const envApiBase = hasProcess
  ? process.env.TARO_APP_API_BASE_URL || process.env.API_BASE_URL
  : undefined;
const BASE_URL =
  envApiBase ||
  (ENV === "development" ? "http://127.0.0.1:3000" : "http://127.0.0.1:3000");
const API_PORT = 3000;

// 简化的Socket URL获取
const getSocketServerUrl = (): string => {
  // 与 BASE_URL 对齐，自动从 http/https 推导 ws/wss
  try {
    const url = new URL(BASE_URL);
    const wsScheme = url.protocol === "https:" ? "wss:" : "ws:";
    return `${wsScheme}//${url.host}`;
  } catch (_e) {
    // 兜底：保持原有默认
    return "ws://127.0.0.1:3000";
  }
};

export const config = {
  BASE_URL,
  API_PORT,
  ENV,
};

export { BASE_URL, API_PORT, ENV, getSocketServerUrl };
