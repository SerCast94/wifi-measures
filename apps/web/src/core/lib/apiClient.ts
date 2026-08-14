import { toast } from "sonner";
import axios, { type AxiosInstance } from "axios";

import { clearSessionCache } from "@/features/auth/lib/clearSessionCache";

const VERSION = "v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.config.method === "get"
    ) {
      clearSessionCache();
      toast.error("Your session has expired. Please log in again.");
    }
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle csrf token errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data.message === "invalid_csrf_token" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      await getCsrfToken();

      return apiClient.request(originalRequest);
    }
    return Promise.reject(error);
  }
);

export const getCsrfToken = async () => {
  const { data } = await apiClient.get(`${VERSION}/csrf/token`);
  return data.csrfToken;
};

export default apiClient;
