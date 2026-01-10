import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import FirstLoginView from "../components/FirstLoginView";
import { apiClient } from "@/utils/axios-interceptor";
import { useAgent } from "@/utils/AgentContext";
import { clearStorage } from "@/utils/storage";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const { agentConfig, updateAgentConfig } = useAgent();

  useEffect(() => {
    console.log("App started, checking for existing agent configuration...");
    clearStorage(); // For testing purposes, clear storage on app start
    const initialize = async () => {
      try {
        if (agentConfig) {
          // Redirect to tabs layout
          router.replace("/(tabs)/home");
          return;
        }
        apiClient
          .get("/agents/")
          .then(async (response) => {
            if (response.data && response.data.length > 0) {
              const agentData = response.data[0];
              console.log("Fetched agent from server:", agentData);

              // Map API response to AgentConfig structure
              await updateAgentConfig({
                id: agentData.id,
                agentName: agentData.name,
                agentGender: agentData.agent_gender,
                companyName: agentData.company_name,
                sector: agentData.sector,
                agentDescription: agentData.agent_description,
                socialMediaAndWeb: agentData.social_media_and_web,
              });

              router.replace("/(tabs)/home");
            } else {
              console.log("No agents found on server");
            }
          })
          .catch((error) => {
            console.log("Error fetching agents from server:", error.message);
          });
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [agentConfig]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <FirstLoginView />;
}
