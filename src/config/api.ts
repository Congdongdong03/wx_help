import { BASE_URL } from "./env";

// API configuration
export const getBaseUrl = () => {
  return BASE_URL;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  getApiUrl: (path: string) => `${getBaseUrl()}${path}`,
  getImageUrl: (path: string) => `${getBaseUrl()}${path}`,
};
