import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { showError, showSuccess } from "@/app/utils/toast";
import { VoiceInput } from "@/app/components/VoiceInput";

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

export default function CompanyServices() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyServices, setCompanyServices] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [autoScraped, setAutoScraped] = useState(false);

  // Get params from previous screens
  const sector = params.sector as string;
  const companyName = params.companyName as string;
  const socialMediaAndWeb = params.socialMediaAndWeb as string;

  const handleScrape = useCallback(async () => {
    if (!socialMediaAndWeb || socialMediaAndWeb.trim() === "") {
      showError(
        t("common.error"),
        t(
          "companyServices.noUrls",
          "No URLs to scrape. Please add website or social media links in the previous step.",
        ),
      );
      return;
    }

    setIsScraping(true);
    try {
      const response = await apiClient.post("scrape-company-info/", {
        urls: socialMediaAndWeb,
        company_name: companyName,
        sector: sector,
      });

      const data = response.data;
      if (data.company_description) {
        setCompanyDescription(data.company_description);
      }
      if (data.company_services) {
        setCompanyServices(data.company_services);
      }

      if (data.company_description || data.company_services) {
        showSuccess(
          t("common.success"),
          t(
            "companyServices.scrapeSuccess",
            "Company information extracted successfully!",
          ),
        );
      }
    } catch (error: any) {
      console.error("Error scraping company info:", error);
      showError(
        t("common.error"),
        error.response?.data?.error ||
          t(
            "companyServices.scrapeFailed",
            "Failed to extract company information",
          ),
      );
    } finally {
      setIsScraping(false);
    }
  }, [socialMediaAndWeb, companyName, sector, t]);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scrape if socialMediaAndWeb exists and hasn't been scraped yet
  useEffect(() => {
    const autoScrape = async () => {
      if (
        socialMediaAndWeb &&
        socialMediaAndWeb.trim() !== "" &&
        !autoScraped &&
        !isScraping
      ) {
        console.log("[AUTO-SCRAPE] Starting automatic scraping...");
        setAutoScraped(true);
        await handleScrape();
      }
    };

    // Delay auto-scrape to allow UI to render first
    const timer = setTimeout(autoScrape, 1000);
    return () => clearTimeout(timer);
  }, [socialMediaAndWeb, autoScraped, isScraping, handleScrape]);

  const handleSubmit = () => {
    // Continue to agent setup with all collected data
    router.push({
      pathname: "/intro/agent-setup",
      params: {
        sector,
        companyName,
        socialMediaAndWeb,
        companyDescription,
        companyServices,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <AnimatedView show={showContent}>
            <Text style={styles.title}>
              {t("companyServices.title", "Company Details")}
            </Text>
          </AnimatedView>

          <AnimatedView show={showContent} delay={200}>
            <Text style={styles.subtitle}>
              {t(
                "companyServices.subtitle",
                "Add information about your company and services. You can use voice input or type directly.",
              )}
            </Text>
          </AnimatedView>

          {/* Scrape Button */}
          {socialMediaAndWeb && (
            <AnimatedView show={showContent} delay={300}>
              {autoScraped && !isScraping ? (
                <View style={styles.autoScrapeInfo}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.autoScrapeInfoText}>
                    {t(
                      "companyServices.autoScraped",
                      "✓ Information automatically extracted from your links",
                    )}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.scrapeButton,
                  isScraping && styles.scrapeButtonDisabled,
                ]}
                onPress={handleScrape}
                disabled={isScraping}
              >
                {isScraping ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.scrapeButtonText}>
                      {t("companyServices.scraping", "Analyzing websites...")}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="sparkles"
                      size={20}
                      color={Colors.primary}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.scrapeButtonText}>
                      {t(
                        "companyServices.scrapeFromLinks",
                        autoScraped
                          ? "Re-scrape from website links"
                          : "Auto-fill from website links",
                      )}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </AnimatedView>
          )}

          {/* Company Description */}
          <AnimatedView
            show={showContent}
            delay={400}
            style={styles.inputGroup}
          >
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                {t("companyServices.description", "Company Description")}
                <Text style={styles.optional}> ({t("common.optional")})</Text>
              </Text>
              <VoiceInput
                onTranscription={setCompanyDescription}
                currentValue={companyDescription}
                appendMode={true}
                size="small"
              />
            </View>
            <Text style={styles.helperText}>
              {t(
                "companyServices.descriptionHelper",
                "History, values, mission, and what makes your company unique",
              )}
            </Text>
            <TextInput
              value={companyDescription}
              onChangeText={setCompanyDescription}
              placeholder={t(
                "companyServices.descriptionPlaceholder",
                "Tell us about your company...",
              )}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={styles.textArea}
            />
          </AnimatedView>

          {/* Company Services */}
          <AnimatedView
            show={showContent}
            delay={600}
            style={styles.inputGroup}
          >
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                {t("companyServices.services", "Services Offered")}
                <Text style={styles.optional}> ({t("common.optional")})</Text>
              </Text>
              <VoiceInput
                onTranscription={setCompanyServices}
                currentValue={companyServices}
                appendMode={true}
                size="small"
              />
            </View>
            <Text style={styles.helperText}>
              {t(
                "companyServices.servicesHelper",
                "List your services, pricing, and specialties",
              )}
            </Text>
            <TextInput
              value={companyServices}
              onChangeText={setCompanyServices}
              placeholder={t(
                "companyServices.servicesPlaceholder",
                "List your services and pricing...",
              )}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              style={[styles.textArea, { height: 200 }]}
            />
          </AnimatedView>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <AnimatedView show={showContent} delay={800} style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, isScraping && styles.buttonDisabled]}
          disabled={isScraping}
          onPress={handleSubmit}
        >
          {isScraping ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.continueButtonText}>
              {t("common.continue")}
            </Text>
          )}
        </TouchableOpacity>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  scrapeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  scrapeButtonDisabled: {
    opacity: 0.7,
  },
  scrapeButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  autoScrapeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success + "15",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  autoScrapeInfoText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  optional: {
    fontSize: 15,
    color: Colors.textLight,
    fontWeight: "400",
  },
  helperText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    height: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
