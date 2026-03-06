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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { Ionicons } from "@expo/vector-icons";
import { STORAGE_KEYS } from "@/app/utils/storage";
import { showError, showSuccess } from "@/app/utils/toast";

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
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, "");

    // Handle paste of multiple digits (6-digit code)
    if (digitsOnly.length >= 6) {
      const newCode = digitsOnly.slice(0, 6).split("");
      setCode(newCode);

      // Blur current input and auto-submit
      inputRefs.current[index]?.blur();
      handleVerifyToken(newCode.join(""));
      return;
    }

    // Handle paste of partial code (2-5 digits)
    if (digitsOnly.length > 1) {
      const newCode = [...code];
      const digits = digitsOnly.slice(0, 6).split("");

      // Fill from current index
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });

      setCode(newCode);

      // Focus the next empty input or last filled
      const lastFilledIndex = Math.min(index + digits.length - 1, 5);
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      }
      return;
    }

    // Handle single digit input
    const digit = digitsOnly.slice(-1);
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
    if (key === "Backspace") {
      if (code[index]) {
        // Delete current digit
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        // Move to previous input and delete its digit
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyToken = async (tokenCode?: string) => {
    const token = tokenCode || code.join("");

    if (token.length !== 6) {
      showError(t("common.error"), t("verifyToken.codeRequired"));
      return;
    }

    setIsLoading(true);
    let navigationPerformed = false;
    
    try {
        console.log("🔐 [VERIFY] Verifying token...");
        const response = await apiClient.post("auth/verify-token/", {
          email,
          token,
        });

        console.log("✅ [VERIFY] Token verified successfully");

        // Save tokens using constants
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(response.user),
        );

        console.log("✅ [VERIFY] Tokens saved to storage");

        // Set flag to avoid updating state after navigation
        navigationPerformed = true;

        // Redirect based on user status IMMEDIATELY
        // Don't wait for notifications to avoid freezing the app
        if (response.is_new_user) {
            console.log("➡️ [NAV] New user, navigating to setup");
            // New user or user without company info - go to setup (will trigger index.tsx flow)
            router.replace("/");
        } else {
            console.log("➡️ [NAV] Existing user, navigating to home");
            // Existing user with company info - go directly to main app (skip splash)
            router.replace("/(tabs)/home" as any);
        }

        // Register for push notifications in the background (non-blocking)
        // This happens after navigation so it won't freeze the app
        setTimeout(async () => {
          try {
            console.log("🔔 [NOTIF] Starting notification registration...");
            const NotificationService = (
              await import("./notifications/NotificationService")
            ).default;
            const notificationService = NotificationService.getInstance();

            // Request permissions and get token
            const pushToken =
              await notificationService.requestPermissionsAndRegister();
            if (pushToken) {
              console.log("✅ [NOTIF] Token obtained:", pushToken.substring(0, 20) + "...");
              // Send to server
              await notificationService.sendTokenToServer();
              console.log("✅ [NOTIF] Token sent to server");
            }
          } catch (notifError) {
            console.error("⚠️ [NOTIF] Error setting up notifications:", notifError);
            // Don't block login if notifications fail
          }
        }, 100);
    } catch (error: any) {
      console.error("❌ [VERIFY] Error verifying token:", error);
      showError(
        t("common.error"),
        error.response?.data?.error || t("verifyToken.verifyFailed"),
      );
      // Clear code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      // Only update loading state if navigation hasn't happened yet
      // to avoid updating state on unmounted component
      if (!navigationPerformed) {
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    setResendLoading(true);
    try {
      await apiClient.post("auth/request-token/", { email });
      setResendCountdown(60);
      showSuccess(t("common.success"), t("verifyToken.codeSent"));
    } catch (error: any) {
      if (__DEV__) console.error("Error resending code:", error);
      showError(
        t("common.error"),
        error.response?.data?.error || t("verifyToken.resendFailed"),
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
              editable={!isLoading}
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
