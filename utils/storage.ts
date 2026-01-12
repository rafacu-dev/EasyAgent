import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AgentConfig } from "./types";

// Storage keys
export const STORAGE_KEYS = {
  AGENT_CONFIG: "agent_config",
  AUTH_TOKEN: "authToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

// Storage functions
export const saveAgentConfig = async (config: AgentConfig): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(config);
    await AsyncStorage.setItem(STORAGE_KEYS.AGENT_CONFIG, jsonValue);
  } catch (error) {
    console.error("Error saving agent config:", error);
    throw new Error("Failed to save agent configuration");
  }
};

export const getAgentConfig = async (): Promise<AgentConfig | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.AGENT_CONFIG);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error reading agent config:", error);
    throw new Error("Failed to read agent configuration");
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AGENT_CONFIG);
  } catch (error) {
    console.error("Error clearing storage:", error);
    throw new Error("Failed to clear storage");
  }
};

// Auth storage functions
export const saveAuthTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error("Error saving auth tokens:", error);
    throw new Error("Failed to save auth tokens");
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("Error reading auth token:", error);
    return null;
  }
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.AGENT_CONFIG,
    ]);
  } catch (error) {
    console.error("Error clearing auth data:", error);
    throw new Error("Failed to clear auth data");
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};
