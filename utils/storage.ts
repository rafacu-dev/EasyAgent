import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AgentConfig } from "./types";

// Storage keys
export const STORAGE_KEYS = {
  AGENT_CONFIG: "agent_config",
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
