import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../axios-interceptor";
import { saveAgentConfig } from "../storage";
import type { AgentConfig } from "../types";

// Fetch agent from API
const fetchAgent = async (): Promise<AgentConfig | null> => {
  const response = await apiClient.get("agents/");
  if (response.data && response.data.length > 0) {
    const agentData = response.data[0];

    const config: AgentConfig = {
      id: agentData.id,
      agentName: agentData.name,
      agentGender: agentData.agent_gender,
      companyName: agentData.company_name,
      sector: agentData.sector,
      agentDescription: agentData.agent_description,
      socialMediaAndWeb: agentData.social_media_and_web,
      companyServices: agentData.company_services || "",
      companyDescription: agentData.company_description || "",
      language: agentData.language || "auto",
    };

    // Save to cache
    await saveAgentConfig(config);
    return config;
  }
  return null;
};

// Update agent on backend
const updateAgentOnBackend = async (
  config: AgentConfig,
): Promise<AgentConfig> => {
  await apiClient.patch(`/agents/${config.id}/`, {
    name: config.agentName,
    agent_gender: config.agentGender,
    agent_description: config.agentDescription,
    social_media_and_web: config.socialMediaAndWeb,
    company_services: config.companyServices || "",
    company_description: config.companyDescription || "",
    language: config.language || "auto",
  });

  await saveAgentConfig(config);
  return config;
};

export const useAgentQuery = () => {
  return useQuery({
    queryKey: ["agent"],
    queryFn: fetchAgent,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 2,
  });
};

export const useUpdateAgentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgentOnBackend,
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.setQueryData(["agent"], data);
      queryClient.invalidateQueries({ queryKey: ["phoneNumbers"] });
    },
  });
};
