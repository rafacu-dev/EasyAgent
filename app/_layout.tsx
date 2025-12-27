import Constants from "expo-constants";
import { Stack } from "expo-router";
import '../utils/i18n'; // Initialize i18n
import { AgentProvider } from '../utils/AgentContext';

export default function RootLayout() {
    return (
        <AgentProvider>
            <Stack 
                screenOptions={{ 
                    headerShown: false,
                    contentStyle: {
                    paddingTop: Constants.statusBarHeight
                    }
                }} 
            />
        </AgentProvider>
    );
}
