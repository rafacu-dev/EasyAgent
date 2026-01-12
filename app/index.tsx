import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirstLoginView from "../components/FirstLoginView";
import { apiClient } from "@/utils/axios-interceptor";
import { useAgent } from "@/utils/AgentContext";
import { clearStorage } from "@/utils/storage";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { agentConfig, updateAgentConfig } = useAgent();

  useEffect(() => {
    console.log("App started, checking authentication...");

    const initialize = async () => {
      try {
        // Check if user is authenticated
        const authToken = await AsyncStorage.getItem("authToken");

        if (!authToken) {
          // Not authenticated, redirect to login
          console.log("No auth token found, redirecting to login");
          router.replace("/login" as any);
          return;
        }

        setIsAuthenticated(true);

        if (agentConfig) {
          // Redirect to tabs layout
          router.replace("/(tabs)/home");
          return;
        }

        // Fetch agent from server
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
              setIsLoading(false);
            }
          })
          .catch((error) => {
            console.log("Error fetching agents from server:", error.message);
            // If 401 error, redirect to login
            if (error.response?.status === 401) {
              AsyncStorage.removeItem("authToken");
              router.replace("/login" as any);
            } else {
              setIsLoading(false);
            }
          });
      } catch (error) {
        console.error("Error initializing app:", error);
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

  // Only show FirstLoginView if authenticated but no agent config
  if (isAuthenticated) {
    return <FirstLoginView />;
  }

  // This shouldn't render, but return loading as fallback
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
