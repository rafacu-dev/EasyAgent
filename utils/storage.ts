import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  AGENT_CONFIG: 'agent_config',
} as const;

// Types
export interface AgentConfig {
  templateId: string;
  companyName: string;
  socialMediaAndWeb: string;
  agentGender: 'male' | 'female';
  agentName: string;
  agentDescription: string;
}

// Storage functions
export const saveAgentConfig = async (config: AgentConfig): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(config);
    await AsyncStorage.setItem(STORAGE_KEYS.AGENT_CONFIG, jsonValue);
  } catch (error) {
    console.error('Error saving agent config:', error);
    throw new Error('Failed to save agent configuration');
  }
};

export const getAgentConfig = async (): Promise<AgentConfig | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.AGENT_CONFIG);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error reading agent config:', error);
    throw new Error('Failed to read agent configuration');
  }
};