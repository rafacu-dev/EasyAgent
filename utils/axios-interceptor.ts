import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BaseUrl } from "./constants";

/**
 * Centralized API Client with interceptors
 * All HTTP requests should use this instance
 */
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: BaseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Configure interceptors
    this.setupInterceptors();
  }

  /**
   * Configure request and response interceptors
   */
  private setupInterceptors(): void {
    // Request Interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Add JWT Auth token if exists
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

    // Response Interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        // Handle HTTP errors
        if (error.response) {
          const { status, data } = error.response;

          console.error(` [${status}] ${error.config?.url}`, data);

          // Handle specific error cases
          switch (status) {
            case 401:
              // Invalid or expired token
              console.log("Invalid or expired token");
              await AsyncStorage.removeItem("authToken");
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

            default:
              console.log(`HTTP Error ${status}`);
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error("❌ No response from server:", error.request);
        } else {
          // Error configuring the request
          console.error("❌ Error configuring request:", error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the configured axios instance
   */
  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Helper methods for common requests
   */
  public async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}

// Export a single instance (Singleton)
export const apiClient = new ApiClient();

// Export the axios instance for advanced cases
export const axiosInstance = apiClient.getInstance();

export default apiClient;
