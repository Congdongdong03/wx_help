// API configuration
export const getBaseUrl = () => {
  return "http://localhost:3000";
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  getApiUrl: (path: string) => `${getBaseUrl()}/api${path}`,
  getImageUrl: (path: string) => `${getBaseUrl()}${path}`,
};
