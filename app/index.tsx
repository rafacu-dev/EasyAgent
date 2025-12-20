import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { getAgentConfig } from "../utils/storage";
import FirstLoginView from "../components/FirstLoginView";
import HomeView from "../components/HomeView";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAgent, setHasAgent] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check for agent config
        const agentConfig = await getAgentConfig();
        if (agentConfig) {
          localStorage.clear();
          console.log("Agent config found:", agentConfig);
          setHasAgent(true);
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (hasAgent) {
    return <HomeView />;
  }

  return <FirstLoginView />;
}
