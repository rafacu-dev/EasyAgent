import { useState } from "react";
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
import { router } from "expo-router";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { Ionicons } from "@expo/vector-icons";
import { showError } from "@/app/utils/toast";

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestToken = async () => {
    if (!email.trim()) {
      showError(t("common.error"), t("login.emailRequired"));
      return;
    }

    if (!isValidEmail(email)) {
      showError(t("common.error"), t("login.invalidEmail"));
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("auth/request-token/", {
        email: email.toLowerCase(),
      });
      // Navigate to verify screen with email
      router.push({
        pathname: "/verify-token" as any,
        params: { email: email.toLowerCase() },
      });
    } catch (error: any) {
      console.error("Error requesting token:", error);
      showError(
        t("common.error"),
        error.response?.data?.error || t("login.requestFailed"),
      );
    } finally {
      setIsLoading(false);
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
        {/* Logo/Icon */}
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
          <Ionicons name="person-outline" size={50} color={Colors.textWhite} />
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
          {t("login.title")}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 16,
            color: Colors.textSecondary,
            marginBottom: 40,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {t("login.subtitle")}
        </Text>

        {/* Email Input */}
        <View
          style={{
            width: "100%",
            maxWidth: 360,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: Colors.textPrimary,
              marginBottom: 8,
            }}
          >
            {t("login.emailLabel")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.cardBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.border,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.textSecondary}
            />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 12,
                fontSize: 16,
                color: Colors.textPrimary,
              }}
              placeholder={t("login.emailPlaceholder")}
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Continue Button */}
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
          onPress={handleRequestToken}
          disabled={isLoading}
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
              {t("common.continue")}
            </Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text
          style={{
            fontSize: 12,
            color: Colors.textLight,
            marginTop: 24,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {t("login.infoText")}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
