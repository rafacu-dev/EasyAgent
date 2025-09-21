import Constants from "expo-constants";
import { Stack } from "expo-router";

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
