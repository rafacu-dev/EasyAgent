import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getAgentConfig, saveAgentConfig } from "./storage";
import { apiClient } from "./axios-interceptor";
import type { AgentConfig } from "./types";

interface AgentContextType {
  agentConfig: AgentConfig | null;
  isLoading: boolean;
  refreshAgentConfig: () => Promise<void>;
  updateAgentConfig: (config: AgentConfig) => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch (error) {
      console.error("Error updating agent config:", error);
      throw error;
    }
  };

  useEffect(() => {
    loadAgentConfig();
  }, []);

  return (
    <AgentContext.Provider
      value={{
        agentConfig,
        isLoading,
        refreshAgentConfig,
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
