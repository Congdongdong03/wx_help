// 简化的环境配置
const BASE_URL = "http://127.0.0.1:3000";
const API_PORT = 3000;
const ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

// 简化的Socket URL获取
const getSocketServerUrl = (): string => {
  // 开发环境使用本地地址
  if (ENV === "development") {
    return "ws://127.0.0.1:3000";
  }
  // 生产环境使用实际地址
  return "ws://127.0.0.1:3000";
};

export const config = {
  BASE_URL,
  API_PORT,
  ENV,
};

export { BASE_URL, API_PORT, ENV, getSocketServerUrl };
