import Constants from "expo-constants";
import { Stack } from "expo-router";
import "../utils/i18n"; // Initialize i18n
import { AgentProvider } from "../utils/AgentContext";
import { Colors } from "../utils/colors";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../utils/queryClient";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
