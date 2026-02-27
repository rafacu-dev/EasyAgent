import Constants from "expo-constants";
import { Stack } from "expo-router";
import "./utils/i18n"; // Initialize i18n
import { Colors } from "@/app/utils/colors";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/app/utils/queryClient";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform, StatusBar } from "react-native";
import { saveLastLogin, getAuthToken } from "@/app/utils/storage";
import * as Updates from "expo-updates";
import { RevenueCatProvider } from "@/app/contexts/RevenueCatContext";
import NotificationProvider from "./notifications/NotificationProvider";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/app/utils/toastConfig";

function AppStateHandler({ children }: { children: React.ReactNode }) {
  const appState = useRef(AppState.currentState);
  const queryClient = useQueryClient();

  // La verificación de updates se hace en index.tsx al iniciar la app
  // para evitar verificaciones duplicadas y conflictos

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
      <RevenueCatProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <AppStateHandler>
          <NotificationProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: Colors.background,
                  paddingTop: Constants.statusBarHeight,
                },
              }}
            >
              <Stack.Screen
                name="create-appointment"
                options={{
                  presentation: "modal",
                  contentStyle: { backgroundColor: Colors.background },
                }}
              />
              <Stack.Screen
                name="compose-message"
                options={{
                  presentation: "modal",
                  contentStyle: { backgroundColor: Colors.background },
                }}
              />
            </Stack>
            <Toast config={toastConfig} />
          </NotificationProvider>
        </AppStateHandler>
      </RevenueCatProvider>
    </QueryClientProvider>
  );
}
