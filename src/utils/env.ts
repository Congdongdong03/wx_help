interface EnvConfig {
  BASE_URL: string;
  API_PORT: number;
  ENV: "development" | "production";
  LOCAL_IP: string;
}

// 默认配置
const defaultConfig: EnvConfig = {
  BASE_URL: "http://localhost:3000",
  API_PORT: 3000,
  ENV: "development",
  LOCAL_IP: "localhost",
};

// 备用配置
const fallbackConfig: EnvConfig = {
  ...defaultConfig,
  BASE_URL: "http://192.168.1.243:3000",
  LOCAL_IP: "192.168.1.243",
};

// 生产环境配置
const prodConfig: EnvConfig = {
  ...defaultConfig,
  BASE_URL: "https://your-prod-api.com",
  API_PORT: 443,
  ENV: "production",
};

// 检查 localhost 是否可用
const checkLocalhost = async () => {
  try {
    const response = await Taro.request({
      url: "http://localhost:3000/api/health",
      method: "GET",
      timeout: 2000, // 2秒超时
    });
    return response.statusCode === 200;
  } catch (error) {
    console.log("localhost 不可用，切换到 192.168.1.243");
    return false;
  }
};

// 根据环境选择配置
const isDev = true; // 这里可以根据需要修改，或者通过其他方式判断环境
let currentConfig = isDev ? defaultConfig : prodConfig;

// 在开发环境下，尝试使用 localhost，如果失败则使用备用配置
if (isDev) {
  checkLocalhost().then((isLocalhostAvailable) => {
    if (!isLocalhostAvailable) {
      currentConfig = fallbackConfig;
      console.log("使用备用配置:", fallbackConfig.BASE_URL);
    } else {
      console.log("使用默认配置:", defaultConfig.BASE_URL);
    }
  });
}

export const config: EnvConfig = currentConfig;

// 导出配置项
export const { BASE_URL, API_PORT, ENV, LOCAL_IP } = config;
