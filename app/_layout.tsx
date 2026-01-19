import Constants from "expo-constants";
import { Stack } from "expo-router";
import "../utils/i18n"; // Initialize i18n
import { Colors } from "../utils/colors";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { saveLastLogin, getAuthToken } from "../utils/storage";
import * as Updates from "expo-updates";

function AppStateHandler({ children }: { children: React.ReactNode }) {
  const appState = useRef(AppState.currentState);
  const queryClient = useQueryClient();

  // Check for OTA updates on mount
  useEffect(() => {
    async function checkForUpdates() {
      // Check if updates are enabled (only works in production builds, not dev builds or Expo Go)
      if (!Updates.isEnabled) {
        console.log("🔄 [OTA] Updates are not enabled");
        console.log(
          "🔄 [OTA] Updates only work in production builds (eas build)"
        );
        console.log("🔄 [OTA] Current channel:", Updates.channel || "none");
        console.log("🔄 [OTA] Is embedded launch:", Updates.isEmbeddedLaunch);
        return;
      }

      try {
        console.log("🔄 [OTA] Checking for updates...");
        console.log("🔄 [OTA] Update ID:", Updates.updateId);
        console.log("🔄 [OTA] Channel:", Updates.channel);

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("✅ [OTA] Update available! Fetching...");
          console.log("✅ [OTA] Manifest:", update.manifest);
          await Updates.fetchUpdateAsync();
          console.log("✅ [OTA] Update fetched successfully. Reloading app...");
          await Updates.reloadAsync();
        } else {
          console.log("✅ [OTA] App is up to date");
        }
      } catch (error) {
        console.error("❌ [OTA] Error checking for updates:", error);
        console.error("❌ [OTA] This is normal in development builds");
      }
    }

    checkForUpdates();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        // When app becomes active from background, refresh user and agent data
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          try {
            const authToken = await getAuthToken();
            if (authToken) {
              // Invalidate and refetch all queries to get latest data
              await queryClient.invalidateQueries({
                queryKey: ["userProfile"],
              });
              await queryClient.invalidateQueries({ queryKey: ["agent"] });
              await queryClient.invalidateQueries({
                queryKey: ["phoneNumbers"],
              });

              if (__DEV__)
                console.log("Refreshed user and agent data on app open");
            }
          } catch (error) {
            if (__DEV__)
              console.error("Error refreshing data on app open:", error);
          }
        }

        // When app goes to background or inactive, save current time as last login
        if (
          appState.current === "active" &&
          (nextAppState === "background" || nextAppState === "inactive")
        ) {
          const now = new Date().toISOString();
          saveLastLogin(now).catch((err) =>
            console.error("Failed to save last login:", err)
          );
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateHandler>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              paddingTop: Constants.statusBarHeight,
              backgroundColor: Colors.background,
            },
          }}
        />
      </AppStateHandler>
    </QueryClientProvider>
  );
}
