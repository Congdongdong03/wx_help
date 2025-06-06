interface EnvConfig {
  BASE_URL: string;
  API_PORT: number;
  ENV: "development" | "production";
  LOCAL_IP: string;
}

// 默认配置
const defaultConfig: EnvConfig = {
  BASE_URL: "http://192.168.1.243:3000",
  API_PORT: 3000,
  ENV: "development",
  LOCAL_IP: "192.168.1.243",
};

// 开发环境配置
const devConfig: EnvConfig = {
  ...defaultConfig,
  BASE_URL: `http://${process.env.LOCAL_IP || "192.168.1.243"}:${
    defaultConfig.API_PORT
  }`,
  ENV: "development",
  LOCAL_IP: process.env.LOCAL_IP || "192.168.1.243",
};

// 生产环境配置
const prodConfig: EnvConfig = {
  ...defaultConfig,
  BASE_URL: "https://your-prod-api.com",
  API_PORT: 443,
  ENV: "production",
};

// 根据环境变量选择配置
export const config: EnvConfig =
  process.env.NODE_ENV === "development" ? devConfig : prodConfig;

// 导出配置项
export const { BASE_URL, API_PORT, ENV, LOCAL_IP } = config;
