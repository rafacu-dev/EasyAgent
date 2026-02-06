import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import FirstLoginView from "./intro/FirstLoginView";
import { useAgentQuery } from "@/app/hooks";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

export default function Index() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const { data: agentConfig, isLoading: agentLoading } = useAgentQuery();

  // Check for updates on mount
  useEffect(() => {
    const checkForUpdates = async () => {
      const startTime = Date.now();
      const minimumSplashDuration = 3000; // 3 seconds

      try {
        if (!__DEV__) {
          setUpdateStatus(
            t("index.checkingUpdates", "Buscando actualizaciones..."),
          );

          const update = await Updates.checkForUpdateAsync();

          if (update.isAvailable) {
            setUpdateStatus(
              t("index.downloadingUpdate", "Descargando actualización..."),
            );
            await Updates.fetchUpdateAsync();

            setUpdateStatus(
              t("index.applyingUpdate", "Aplicando actualización..."),
            );
            await Updates.reloadAsync();
            // Si llegamos aquí, la app se reinició con la nueva versión
          }
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
        // Continue with normal flow even if update check fails
      } finally {
        // Ensure splash screen shows for at least 3 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minimumSplashDuration - elapsedTime;

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        setIsCheckingUpdates(false);
      }
    };

    checkForUpdates();
  }, [t]);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!authToken);

      if (!authToken) {
        router.replace("/login" as any);
      }
    };

    // Only check auth after updates are checked
    if (!isCheckingUpdates) {
      checkAuth();
    }
  }, [isCheckingUpdates]);

  // Navigate to home when authenticated and agent is loaded
  useEffect(() => {
    if (isAuthenticated && agentConfig && !agentLoading) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, agentConfig, agentLoading]);

  // Show splash screen while checking updates
  if (isCheckingUpdates) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.splashIcon}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
        <Text style={styles.updateText}>{updateStatus}</Text>
      </View>
    );
  }

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

  // Wait for agent loading (only if authenticated)
  if (isAuthenticated && agentLoading) {
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
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  splashIcon: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
  updateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
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
