import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getAgentConfig, saveAgentConfig } from "./storage";
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
  console.log(agentConfig);
  const loadAgentConfig = async () => {
    try {
      setIsLoading(true);
      const config = await getAgentConfig();

      if (config) {
        console.log("Loaded agent config:", config);
        setAgentConfig(config);
      } else {
        setAgentConfig(null);
      }
    } catch (error) {
      console.error("Error loading agent config:", error);
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
