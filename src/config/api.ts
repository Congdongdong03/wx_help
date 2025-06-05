// API configuration
const getBaseUrl = () => {
  if (process.env.TARO_ENV === "weapp") {
    // In WeChat Mini Program, use the development server URL
    return "http://localhost:3000";
  }
  // For other environments (H5, etc.)
  return "http://localhost:3000";
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  getApiUrl: (path: string) => `${getBaseUrl()}/api${path}`,
  getImageUrl: (path: string) => `${getBaseUrl()}${path}`,
};
