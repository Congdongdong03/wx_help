import { BASE_URL } from "./env";

// API configuration
export const API_CONFIG = {
  BASE_URL: BASE_URL,
  getApiUrl: (path: string) => `${BASE_URL}/api${path}`,
  getImageUrl: (path: string) => `${BASE_URL}${path}`,
};
