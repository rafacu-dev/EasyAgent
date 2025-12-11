import Constants from "expo-constants";
import { Stack } from "expo-router";
import '../utils/i18n'; // Initialize i18n

export default function RootLayout() {
    return (
        <Stack 
            screenOptions={{ 
                headerShown: false,
                contentStyle: {
                paddingTop: Constants.statusBarHeight
                }
            }} 
        />
    );
}
