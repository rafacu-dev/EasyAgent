import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirstLoginView from "../components/FirstLoginView";
import { useAgent } from "@/utils/AgentContext";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { agentConfig, isLoading: agentLoading } = useAgent();

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!authToken);

      if (!authToken) {
        router.replace("/login" as any);
      }
    };

    checkAuth();
  }, []);

  // Wait for auth check
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Wait for agent loading (AgentContext handles API fetch if no cache)
  if (agentLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If authenticated and has agent, go to home
  if (isAuthenticated && agentConfig) {
    router.replace("/(tabs)/home");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Authenticated but no agent - show first login view
  if (isAuthenticated) {
    return <FirstLoginView />;
  }

  // Fallback loading
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
