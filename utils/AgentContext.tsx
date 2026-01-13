import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getAgentConfig, saveAgentConfig, getAuthToken } from "./storage";
import type { AgentConfig, AgentContextType } from "./types";
import { apiClient } from "./axios-interceptor";

// Using AgentContextType from global types

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const loadAgentConfig = async () => {
    try {
      setIsLoading(true);

      // First try to load from local storage cache
      const config = await getAgentConfig();

      if (config) {
        setAgentConfig(config);
        setIsLoading(false);
        return;
      }

      // No cache - check if authenticated and fetch from API
      const authToken = await getAuthToken();
      if (!authToken) {
        setAgentConfig(null);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const response = await apiClient.get("agents/");
      if (response.data && response.data.length > 0) {
        const agentData = response.data[0];

        // Map API response to AgentConfig structure
        const newConfig: AgentConfig = {
          id: agentData.id,
          agentName: agentData.name,
          agentGender: agentData.agent_gender,
          companyName: agentData.company_name,
          sector: agentData.sector,
          agentDescription: agentData.agent_description,
          socialMediaAndWeb: agentData.social_media_and_web,
        };

        await saveAgentConfig(newConfig);
        setAgentConfig(newConfig);
      } else {
        setAgentConfig(null);
      }
    } catch (error) {
      if (__DEV__) console.error("Error loading agent config:", error);
      setAgentConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAgentConfig = async () => {
    await loadAgentConfig();
  };

  const updateAgentConfig = async (config: AgentConfig) => {
    try {
      await saveAgentConfig(config);
      setAgentConfig(config);
      // After updating agent config, refresh phone number
      await refreshPhoneNumber();
    } catch (error) {
      console.error("Error updating agent config:", error);
      throw error;
    }
  };

  useEffect(() => {
    loadAgentConfig();
  }, []);

  const refreshPhoneNumber = async () => {
    try {
      if (!agentConfig?.id) {
        setPhoneNumber(null);
        return;
      }
      // Fetch user phone numbers and pick the one linked to current agent
      const numbersResp = await apiClient.get("phone-numbers/");
      const phoneNumbers: any[] =
        numbersResp?.data ?? numbersResp?.phone_numbers ?? [];
      const linked = phoneNumbers.find(
        (pn: any) => pn?.agent === Number(agentConfig.id)
      );
      setPhoneNumber(linked?.phone_number ?? null);
    } catch (error) {
      console.error("Error loading agent phone number:", error);
      setPhoneNumber(null);
    }
  };

  useEffect(() => {
    // Whenever agentConfig changes, try to refresh the phone number
    if (agentConfig?.id) {
      refreshPhoneNumber();
    } else {
      setPhoneNumber(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentConfig?.id]);

  return (
    <AgentContext.Provider
      value={{
        agentConfig,
        isLoading,
        phoneNumber,
        refreshAgentConfig,
        refreshPhoneNumber,
        updateAgentConfig,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
};
