import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import { useEditAgent } from "@/app/hooks/useEditAgent";
import { GenderSelector } from "@/app/components/edit-agent";
import { VoiceInput } from "@/app/components/VoiceInput";
import { apiClient } from "@/app/utils/axios-interceptor";
import { showError, showSuccess } from "@/app/utils/toast";

// Language options for the agent
const LANGUAGE_OPTIONS = [
  { code: "auto", label: "Auto-detect", icon: "globe" },
  { code: "es", label: "Español", icon: "language" },
  { code: "en", label: "English", icon: "language" },
  { code: "fr", label: "Français", icon: "language" },
  { code: "de", label: "Deutsch", icon: "language" },
  { code: "pt", label: "Português", icon: "language" },
  { code: "it", label: "Italiano", icon: "language" },
] as const;

export default function EditAgent() {
  const { t } = useTranslation();
  const {
    formData,
    isLoading,
    isLoadingData,
    isDisabled,
    handleUpdate,
    setGender,
    updateField,
  } = useEditAgent();
  const [isScraping, setIsScraping] = useState(false);

  const handleScrape = async () => {
    if (
      !formData.socialMediaAndWeb ||
      formData.socialMediaAndWeb.trim() === ""
    ) {
      showError(
        t("common.error"),
        t(
          "companyServices.noUrls",
          "No URLs to scrape. Please add website or social media links first.",
        ),
      );
      return;
    }

    setIsScraping(true);
    try {
      const response = await apiClient.post("scrape-company-info/", {
        urls: formData.socialMediaAndWeb,
        company_name: formData.companyName,
        sector: formData.sector,
      });

      const data = response.data;
      if (data.company_description) {
        updateField("companyDescription", data.company_description);
      }
      if (data.company_services) {
        updateField("companyServices", data.company_services);
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
  };

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {t("common.loading", "Loading...")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 30}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {t("editAgent.title", "Edit Agent")}
            </Text>
            <Text style={styles.subtitle}>
              {t(
                "editAgent.subtitle",
                "Update your agent's properties and configuration",
              )}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.form}
          >
            <View style={styles.inputContainer}>
              <GenderSelector
                selectedGender={formData.agentGender}
                onSelectGender={setGender}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("agentSetup.agentName", "Agent Name")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t(
                  "agentSetup.agentNamePlaceholder",
                  "Enter agent name",
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.agentName}
                onChangeText={(text) => updateField("agentName", text)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("companyInfo.companyName", "Company Name")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t(
                  "companyInfo.companyNamePlaceholder",
                  "Enter company name",
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.companyName}
                onChangeText={(text) => updateField("companyName", text)}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {t("agentSetup.description", "Description")} (
                  {t("common.optional", "Optional")})
                </Text>
                <VoiceInput
                  onTranscription={(text) =>
                    updateField("agentDescription", text)
                  }
                  currentValue={formData.agentDescription}
                  appendMode={true}
                  size="small"
                />
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t(
                  "agentSetup.descriptionPlaceholder",
                  "Describe your agent's personality...",
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.agentDescription}
                onChangeText={(text) => updateField("agentDescription", text)}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("companyInfo.socialMedia", "Social Media & Web")} (
                {t("common.optional", "Optional")})
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t(
                  "companyInfo.socialMediaPlaceholder",
                  "Add social media links...",
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.socialMediaAndWeb}
                onChangeText={(text) => updateField("socialMediaAndWeb", text)}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Scrape Button */}
            {formData.socialMediaAndWeb && (
              <View style={styles.inputContainer}>
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
                          "Auto-fill from website links",
                        )}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Company Description */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {t("companyServices.description", "Company Description")} (
                  {t("common.optional", "Optional")})
                </Text>
                <VoiceInput
                  onTranscription={(text) =>
                    updateField("companyDescription", text)
                  }
                  currentValue={formData.companyDescription}
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
                style={[styles.input, styles.textAreaLarge]}
                placeholder={t(
                  "companyServices.descriptionPlaceholder",
                  "Tell us about your company...",
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.companyDescription}
                onChangeText={(text) => updateField("companyDescription", text)}
                multiline
                numberOfLines={6}
              />
            </View>

            {/* Company Services */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {t("companyServices.services", "Services Offered")} (
                  {t("common.optional", "Optional")})
                </Text>
                <VoiceInput
                  onTranscription={(text) =>
                    updateField("companyServices", text)
                  }
                  currentValue={formData.companyServices}
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
                style={[styles.input, styles.textAreaLarge]}
                placeholder={t(
                  "companyServices.servicesPlaceholder",
                  "List your services and pricing...",
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.companyServices}
                onChangeText={(text) => updateField("companyServices", text)}
                multiline
                numberOfLines={6}
              />
            </View>

            {/* Language Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("agentSetup.language", "Agent Language")}
              </Text>
              <Text style={styles.helperText}>
                {t(
                  "agentSetup.languageHelper",
                  "Choose the language your agent will speak",
                )}
              </Text>
              <View style={styles.languageGrid}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.code}
                    style={[
                      styles.languageButton,
                      formData.language === option.code &&
                        styles.languageButtonSelected,
                    ]}
                    onPress={() => updateField("language", option.code)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={
                        formData.language === option.code
                          ? Colors.primary
                          : Colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.languageButtonText,
                        formData.language === option.code &&
                          styles.languageButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("firstLogin.sector", "Sector")}
              </Text>
              <View style={styles.sectorInfo}>
                <Ionicons name="briefcase" size={20} color={Colors.primary} />
                <Text style={styles.sectorText}>
                  {t(`templates.${formData.sector}`, formData.sector)}
                </Text>
              </View>
              <Text style={styles.helperText}>
                {t(
                  "editAgent.sectorHelper",
                  "To change sector, create a new agent",
                )}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={styles.buttonContainer}
      >
        <Pressable
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={isDisabled}
        >
          <Text style={styles.buttonText}>
            {isLoading
              ? t("editAgent.updating", "Updating...")
              : t("editAgent.update", "Update Agent")}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  textAreaLarge: {
    height: 150,
    textAlignVertical: "top",
  },
  scrapeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
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
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    gap: 6,
  },
  languageButtonSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.cardBackground,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  languageButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  languageButtonTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  sectorInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectorText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    fontStyle: "italic",
  },
  buttonContainer: {
    paddingVertical: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
