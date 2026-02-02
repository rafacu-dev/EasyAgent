import React from "react";
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
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import { useEditAgent } from "@/app/hooks/useEditAgent";
import { GenderSelector } from "@/app/components/edit-agent";

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
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
                "Update your agent's properties and configuration"
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
                  "Enter agent name"
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
                  "Enter company name"
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.companyName}
                onChangeText={(text) => updateField("companyName", text)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("agentSetup.description", "Description")} (
                {t("common.optional", "Optional")})
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t(
                  "agentSetup.descriptionPlaceholder",
                  "Describe your agent's personality..."
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
                  "Add social media links..."
                )}
                placeholderTextColor="#B0B0B0"
                value={formData.socialMediaAndWeb}
                onChangeText={(text) => updateField("socialMediaAndWeb", text)}
                multiline
                numberOfLines={4}
              />
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
                  "To change sector, create a new agent"
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
    marginBottom: 16,
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
