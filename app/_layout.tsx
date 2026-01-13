import Constants from "expo-constants";
import { Stack } from "expo-router";
import "../utils/i18n"; // Initialize i18n
import { AgentProvider } from "../utils/AgentContext";
import { UserProvider } from "../utils/UserContext";
import { Colors } from "../utils/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { saveLastLogin } from "../utils/storage";

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AgentProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                paddingTop: Constants.statusBarHeight,
                backgroundColor: Colors.background,
              },
            }}
          />
        </AgentProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
