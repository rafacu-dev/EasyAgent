import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirstLoginView from "../components/FirstLoginView";
import { useAgentQuery } from "@/utils/hooks";
import { useTranslation } from "react-i18next";
import { Colors } from "@/utils/colors";

export default function Index() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { data: agentConfig, isLoading: agentLoading } = useAgentQuery();

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

  // Navigate to home when authenticated and agent is loaded
  useEffect(() => {
    if (isAuthenticated && agentConfig && !agentLoading) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, agentConfig, agentLoading]);

  // Wait for auth check
  if (isAuthenticated === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {t("index.checkingAuth", "Checking authentication...")}
        </Text>
      </View>
    );
  }

  // Wait for agent loading (React Query handles API fetch and caching)
  if (agentLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {t("index.loadingAgent", "Loading agent...")}
        </Text>
      </View>
    );
  }

  // If authenticated and has agent, show loading while navigating
  if (isAuthenticated && agentConfig) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {t("index.redirecting", "Redirecting...")}
        </Text>
      </View>
    );
  }

  // Authenticated but no agent - show first login view
  if (isAuthenticated) {
    return <FirstLoginView />;
  }

  // Fallback loading
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>
        {t("common.loading", "Loading...")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
