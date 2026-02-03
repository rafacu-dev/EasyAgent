import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { showError } from "@/app/utils/toast";

const AnimatedView = ({
  children,
  show,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  show: boolean;
  delay?: number;
  style?: any;
}) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (show) {
      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 20,
          stiffness: 300,
          mass: 0.5,
        }),
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 20,
          stiffness: 300,
          mass: 0.5,
        }),
      );
    }
  }, [show, delay, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

const AnimatedText = ({
  text,
  style,
  show,
  delay = 0,
}: {
  text: string;
  style?: any;
  show: boolean;
  delay?: number;
}) => {
  return (
    <AnimatedView show={show} delay={delay}>
      <Text style={style}>{text}</Text>
    </AnimatedView>
  );
};

export default function CompanyInfo() {
  const { t } = useTranslation();
  const { sector } = useLocalSearchParams();
  const [companyName, setCompanyName] = useState("");
  const [socialMediaAndWeb, setSocialMediaAndWeb] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!companyName.trim()) return;

    setIsLoading(true);
    try {
      // Save company info to user profile
      await apiClient.patch("profile/", {
        company_name: companyName.trim(),
        sector: sector as string,
      });

      // Continue to company services screen (pass social_media_and_web for scraping)
      router.push({
        pathname: "/intro/company-services",
        params: {
          sector,
          companyName,
          socialMediaAndWeb,
        },
      });
    } catch (error: any) {
      console.error("Error saving company info:", error);
      showError(
        t("common.error"),
        error.response?.data?.error || "Failed to save company info",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 24, paddingBottom: 100, alignItems: "center" }}>
          <AnimatedText
            text={t("companyInfo.title")}
            show={showContent}
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: Colors.textPrimary,
              marginBottom: 12,
              textAlign: "center",
            }}
          />

          <AnimatedText
            text={t("companyInfo.subtitle")}
            show={showContent}
            delay={200}
            style={{
              fontSize: 18,
              color: Colors.textSecondary,
              marginBottom: 40,
              textAlign: "center",
            }}
          />

          <View style={{ width: "100%", gap: 24 }}>
            <AnimatedView show={showContent} delay={400}>
              <Text
                style={{
                  fontSize: 17,
                  color: Colors.textPrimary,
                  marginBottom: 10,
                  fontWeight: "600",
                }}
              >
                {t("companyInfo.companyName")}
              </Text>
              <TextInput
                value={companyName}
                onChangeText={setCompanyName}
                placeholder={t("companyInfo.companyNamePlaceholder")}
                placeholderTextColor="#B0B0B0"
                style={{
                  backgroundColor: Colors.cardBackground,
                  padding: 16,
                  borderRadius: 16,
                  fontSize: 16,
                  shadowColor: Colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              />
            </AnimatedView>

            <AnimatedView show={showContent} delay={600}>
              <Text
                style={{
                  fontSize: 17,
                  color: Colors.textPrimary,
                  marginBottom: 10,
                  fontWeight: "600",
                }}
              >
                {t("companyInfo.socialMedia")}
                <Text
                  style={{
                    fontSize: 15,
                    color: Colors.textLight,
                    fontWeight: "400",
                  }}
                >
                  {" "}
                  ({t("common.optional")})
                </Text>
              </Text>
              <TextInput
                value={socialMediaAndWeb}
                onChangeText={setSocialMediaAndWeb}
                placeholder={t("companyInfo.socialMediaPlaceholder")}
                placeholderTextColor="#B0B0B0"
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                style={{
                  backgroundColor: Colors.cardBackground,
                  padding: 16,
                  borderRadius: 16,
                  fontSize: 16,
                  shadowColor: Colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                  height: 180,
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              />
            </AnimatedView>
          </View>
        </View>
      </ScrollView>

      <AnimatedView
        show={showContent}
        delay={800}
        style={{
          width: "100%",
          padding: 24,
          position: "absolute",
          bottom: 0,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor:
              companyName.trim() === "" || isLoading
                ? Colors.primaryLight
                : Colors.primary,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: Colors.shadowOrange,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: companyName.trim() === "" ? 0.15 : 0.3,
            shadowRadius: 12,
            elevation: 6,
            opacity: companyName.trim() === "" || isLoading ? 0.7 : 1,
          }}
          disabled={companyName.trim() === "" || isLoading}
          onPress={handleSubmit}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text
              style={{
                color: Colors.textWhite,
                fontSize: 17,
                fontWeight: "600",
                letterSpacing: 0.3,
              }}
            >
              {t("common.continue")}
            </Text>
          )}
        </TouchableOpacity>
      </AnimatedView>
    </View>
  );
}
