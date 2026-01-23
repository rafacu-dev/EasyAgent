import Constants from "expo-constants";
import { Platform } from "react-native";
import { BaseUrl } from "./constants";
import axios from "axios";

export async function getConfig() {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
    
        let url = `${BaseUrl}api/config/?platform=${Platform.OS}&version=${Constants.expoConfig?.version}`;
        const res = await axios.get(
            url,
            config
        );
        return res.data;
    }
    catch(err) {
        return null;
    }
}