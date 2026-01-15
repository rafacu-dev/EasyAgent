import { router } from "expo-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { apiClient } from "../utils/axios-interceptor";
import { Colors } from "../utils/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAgentQuery, useUpdateAgentMutation } from "../utils/hooks";
import type { AgentConfig } from "../utils/types";

export default function EditAgent() {
  const { t } = useTranslation();
  const { data: agentConfig, isLoading: isLoadingData } = useAgentQuery();
  const updateAgentMutation = useUpdateAgentMutation();

  const [formData, setFormData] = useState({
    agentName: agentConfig?.agentName || "",
    agentGender: (agentConfig?.agentGender || "male") as "male" | "female",
    agentDescription: agentConfig?.agentDescription || "",
    sector: agentConfig?.sector || "",
    companyName: agentConfig?.companyName || "",
    socialMediaAndWeb: agentConfig?.socialMediaAndWeb || "",
    agentId: agentConfig?.id,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentConfig) {
      setFormData({
        agentName: agentConfig.agentName || "",
        agentGender: agentConfig.agentGender || "male",
        agentDescription: agentConfig.agentDescription || "",
        sector: agentConfig.sector || "",
        companyName: agentConfig.companyName || "",
        socialMediaAndWeb: agentConfig.socialMediaAndWeb || "",
        agentId: agentConfig.id,
      });
    }
  }, [agentConfig]);

  const handleUpdate = async () => {
    if (isLoading) return;

    if (!formData.agentId) {
      Alert.alert(
        t("common.error", "Error"),
        t("editAgent.noAgentId", "Agent ID not found. Cannot update.")
      );
      return;
    }

    setIsLoading(true);
    try {
      // Update user profile (company info)
      await apiClient.patch("profile/", {
        company_name: formData.companyName,
        sector: formData.sector,
      });

      // Update agent via mutation
      const updatedConfig: AgentConfig = {
        id: formData.agentId,
        sector: formData.sector,
        companyName: formData.companyName,
        socialMediaAndWeb: formData.socialMediaAndWeb,
        agentGender: formData.agentGender,
        agentName: formData.agentName,
        agentDescription: formData.agentDescription,
      };

      await updateAgentMutation.mutateAsync(updatedConfig);

      Alert.alert(
        t("common.success", "Success"),
        t("editAgent.updateSuccess", "Agent updated successfully"),
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error updating agent:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t("editAgent.updateError", "Failed to update agent");
      Alert.alert(t("common.error", "Error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    formData.agentName.trim() === "" ||
    isLoading ||
    isLoadingData ||
    formData.companyName.trim() === "";

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
              <View style={styles.genderContainer}>
                <Animated.View>
                  <Pressable
                    style={styles.genderButton}
                    onPress={() =>
                      setFormData({ ...formData, agentGender: "male" })
                    }
                  >
                    <View
                      style={[
                        styles.imageContainer,
                        formData.agentGender === "male" &&
                          styles.selectedImageContainer,
                      ]}
                    >
                      <Image
                        source={require("../assets/images/agent-m.jpg")}
                        style={styles.genderImage}
                      />
                    </View>
                    <Text
                      style={[
                        styles.genderText,
                        formData.agentGender === "male" &&
                          styles.selectedGenderText,
                      ]}
                    >
                      {t("agentSetup.masculine", "Masculine")}
                    </Text>
                  </Pressable>
                </Animated.View>

                <Animated.View>
                  <Pressable
                    style={styles.genderButton}
                    onPress={() =>
                      setFormData({ ...formData, agentGender: "female" })
                    }
                  >
                    <View
                      style={[
                        styles.imageContainer,
                        formData.agentGender === "female" &&
                          styles.selectedImageContainer,
                      ]}
                    >
                      <Image
                        source={require("../assets/images/agent-f.jpg")}
                        style={styles.genderImage}
                      />
                    </View>
                    <Text
                      style={[
                        styles.genderText,
                        formData.agentGender === "female" &&
                          styles.selectedGenderText,
                      ]}
                    >
                      {t("agentSetup.feminine", "Feminine")}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
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
                onChangeText={(text) =>
                  setFormData({ ...formData, agentName: text })
                }
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
                onChangeText={(text) =>
                  setFormData({ ...formData, companyName: text })
                }
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
                onChangeText={(text) =>
                  setFormData({ ...formData, agentDescription: text })
                }
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
                onChangeText={(text) =>
                  setFormData({ ...formData, socialMediaAndWeb: text })
                }
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
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
  },
  genderButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    margin: 10,
  },
  imageContainer: {
    padding: 2,
    borderWidth: 3,
    borderColor: "transparent",
    borderRadius: 68,
    marginBottom: 12,
  },
  selectedImageContainer: {
    borderColor: Colors.primary,
  },
  genderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  genderText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  selectedGenderText: {
    color: Colors.primary,
    fontWeight: "600",
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
