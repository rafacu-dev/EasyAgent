import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../utils/colors";
import { apiClient } from "@/utils/axios-interceptor";
import { Ionicons } from "@expo/vector-icons";
import { STORAGE_KEYS } from "@/utils/storage";

export default function VerifyTokenScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown for resend
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerifyToken(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyToken = async (tokenCode?: string) => {
    const token = tokenCode || code.join("");

    if (token.length !== 6) {
      Alert.alert(t("common.error"), t("verifyToken.codeRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("auth/verify-token/", {
        email,
        token,
      });

      // Save tokens using constants
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh);
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(response.user)
      );

      // Redirect based on user status
      if (response.is_new_user) {
        // New user or user without company info - go to setup
        router.replace("/");
      } else {
        // Existing user with company info - go to main app
        router.replace("/");
      }
    } catch (error: any) {
      if (__DEV__) console.error("Error verifying token:", error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.error || t("verifyToken.verifyFailed")
      );
      // Clear code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    setResendLoading(true);
    try {
      await apiClient.post("auth/request-token/", { email });
      setResendCountdown(60);
      Alert.alert(t("common.success"), t("verifyToken.codeSent"));
    } catch (error: any) {
      if (__DEV__) console.error("Error resending code:", error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.error || t("verifyToken.resendFailed")
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            padding: 8,
          }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Icon */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: Colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
            shadowColor: Colors.shadow,
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Ionicons
            name="mail-open-outline"
            size={50}
            color={Colors.textWhite}
          />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: Colors.textPrimary,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {t("verifyToken.title")}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 16,
            color: Colors.textSecondary,
            marginBottom: 8,
            textAlign: "center",
            maxWidth: 300,
          }}
        >
          {t("verifyToken.subtitle")}
        </Text>

        {/* Email display */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: Colors.primary,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          {email}
        </Text>

        {/* Code Input */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={{
                width: 48,
                height: 56,
                backgroundColor: Colors.cardBackground,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: digit ? Colors.primary : Colors.border,
                fontSize: 24,
                fontWeight: "bold",
                textAlign: "center",
                color: Colors.textPrimary,
              }}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              editable={!isLoading}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={{
            width: "100%",
            maxWidth: 360,
            backgroundColor: Colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            opacity: isLoading ? 0.7 : 1,
          }}
          onPress={() => handleVerifyToken()}
          disabled={isLoading || code.join("").length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text
              style={{
                color: Colors.textWhite,
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {t("verifyToken.verify")}
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
            {t("verifyToken.noCode")}
          </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendCountdown > 0 || resendLoading}
            style={{ marginLeft: 4 }}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text
                style={{
                  color:
                    resendCountdown > 0 ? Colors.textLight : Colors.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {resendCountdown > 0
                  ? `${t("verifyToken.resend")} (${resendCountdown}s)`
                  : t("verifyToken.resend")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
