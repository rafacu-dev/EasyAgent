/**
 * API Client - Centralized HTTP client with interceptors
 * Handles authentication, error handling, and request/response transformation
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { API_BASE_URL, API_TIMEOUTS } from "./config";

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUTS.DEFAULT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const authToken = await AsyncStorage.getItem("authToken");
          if (authToken && config.headers) {
            config.headers.Authorization = `Bearer ${authToken}`;
          }
          return config;
        } catch (error) {
          console.error("Error in request interceptor:", error);
          return config;
        }
      },
      (error: AxiosError) => {
        console.error("❌ Request error:", error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Handle errors
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response) {
          const { status, data } = error.response;
          console.error(` [${status}] ${error.config?.url}`, data);

          switch (status) {
            case 401:
              console.log("Invalid or expired token, redirecting to login");
              await AsyncStorage.removeItem("authToken");
              await AsyncStorage.removeItem("refreshToken");
              await AsyncStorage.removeItem("user");
              router.replace("/login");
              break;
            case 403:
              console.log("Access denied");
              break;
            case 404:
              console.log("Resource not found");
              break;
            case 500:
              console.log("Server error");
              break;
          }
        } else if (error.request) {
          console.error("❌ No response from server:", error.request);
        } else {
          console.error("❌ Request configuration error:", error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  async get<T>(url: string, params?: object): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: object): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: object): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: object): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
