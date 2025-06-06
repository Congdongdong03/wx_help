// API configuration
const getBaseUrl = () => {
  // 优先用局域网地址，兜底用 localhost
  return "http://192.168.1.243:3000" || "http://localhost:3000";
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  getApiUrl: (path: string) => `${getBaseUrl()}/api${path}`,
  getImageUrl: (path: string) => `${getBaseUrl()}${path}`,
};
