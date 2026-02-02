import Constants from "expo-constants";
import { Stack } from "expo-router";
import "./utils/i18n"; // Initialize i18n
import { Colors } from "@/app/utils/colors";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/app/utils/queryClient";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { saveLastLogin, getAuthToken } from "@/app/utils/storage";
import * as Updates from "expo-updates";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import NotificationProvider from "./notifications/NotificationProvider";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/app/utils/toastConfig";

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
          "🔄 [OTA] Updates only work in production builds (eas build)",
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
            console.error("Failed to save last login:", err),
          );
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

  return <>{children}</>;
}

export default function RootLayout() {
  // useEffect(() => {
  //   const initializePurchases = async () => {
  //     Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  //     if (Platform.OS === "ios") {
  //       Purchases.configure({
  //         apiKey: Constants.expoConfig?.extra?.rcApplApiKey,
  //       });
  //     } else if (Platform.OS === "android") {
  //       Purchases.configure({
  //         apiKey: Constants.expoConfig?.extra?.rcGooglApiKey,
  //       });
  //     }
  //   };

  //   initializePurchases();
  // }, []);

  useEffect(() => {
    const initializeFacebookSDK = async () => {
      // No ejecutar en Expo Go
      const isExpoGo = Constants.appOwnership === "expo";
      if (isExpoGo) {
        return;
      }

      try {
        // Importación dinámica solo cuando no está en Expo Go
        const { requestTrackingPermissionsAsync } =
          await import("expo-tracking-transparency");
        const { Settings } = await import("react-native-fbsdk-next");

        // 1️⃣ PEDIR PERMISO (ATT) - Usando la librería oficial de Expo
        if (Platform.OS === "ios") {
          const { status } = await requestTrackingPermissionsAsync();
          console.log("Tracking status:", status);

          // Habilitar tracking de anunciantes después del permiso ATT
          await Settings.setAdvertiserTrackingEnabled(status === "granted");
        }

        // 2️⃣ INICIALIZAR FACEBOOK SDK
        await Settings.initializeSDK();
        console.log("✅ Facebook SDK initialized successfully");
      } catch (error) {
        console.error("Error initializing Facebook SDK:", error);
      }
    };

    initializeFacebookSDK();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateHandler>
        <NotificationProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                paddingTop: Constants.statusBarHeight,
                backgroundColor: Colors.background,
              },
            }}
          >
            <Stack.Screen
              name="create-appointment"
              options={{
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="compose-message"
              options={{
                presentation: "modal",
              }}
            />
          </Stack>
          <Toast config={toastConfig} />
        </NotificationProvider>
      </AppStateHandler>
    </QueryClientProvider>
  );
}
