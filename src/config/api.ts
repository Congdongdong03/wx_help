// API configuration
export const getBaseUrl = () => {
  return "http://192.168.1.243:3000";
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  getApiUrl: (path: string) => `${getBaseUrl()}/api${path}`,
  getImageUrl: (path: string) => `${getBaseUrl()}${path}`,
};
