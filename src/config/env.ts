// 安全获取环境变量
const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

// 智能获取 Socket 服务器地址
const getSmartSocketUrl = (): string => {
  // 优先使用环境变量
  const envSocketUrl = getEnvVar("REACT_APP_SOCKET_URL");
  if (envSocketUrl) {
    return envSocketUrl;
  }

  // Taro 小程序环境
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Taro = require("@tarojs/taro");
    if (Taro && Taro.getEnv && Taro.getEnv() === "WEAPP") {
      return "ws://192.168.20.18:3000";
    }
  } catch (e) {}

  // 微信小程序原生判断
  if (typeof wx !== "undefined" && typeof wx.getSystemInfo === "function") {
    return "ws://192.168.20.18:3000";
  }

  // 微信H5环境
  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    /micromessenger/i.test(navigator.userAgent)
  ) {
    return "ws://192.168.20.18:3000";
  }

  // 浏览器环境自动判断
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "ws://localhost:3000";
    }
    // 局域网访问
    return "ws://192.168.20.18:3000";
  }

  // Node 环境默认
  return "ws://localhost:3000";
};

interface EnvConfig {
  BASE_URL: string;
  API_PORT: number;
  ENV: "development" | "production";
  LOCAL_IP: string;
  SOCKET_SERVER_URL: string;
}

// 统一配置（开发和生产都一样）
const baseConfig: EnvConfig = {
  BASE_URL: "http://192.168.20.18:3000",
  API_PORT: 3000,
  ENV:
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "production"
      ? "production"
      : "development",
  LOCAL_IP: "192.168.20.18",
  SOCKET_SERVER_URL: getSmartSocketUrl(),
};

export const config: EnvConfig = baseConfig;
export const { BASE_URL, API_PORT, ENV, LOCAL_IP, SOCKET_SERVER_URL } = config;
export const getSocketServerUrl = getSmartSocketUrl;
