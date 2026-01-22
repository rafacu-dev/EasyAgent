import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { apiClient } from "../utils/axios-interceptor";
import { Colors } from "../utils/colors";
import { useUpdateAgentMutation } from "../utils/hooks";
import { showError } from "@/utils/toast";

export default function AgentSetup() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const updateAgentMutation = useUpdateAgentMutation();
  const [agentName, setAgentName] = useState("Alex");
  const [agentGender, setAgentGender] = useState<"male" | "female">("male");
  const [agentDescription, setAgentDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Create agent in Retell.ai (company info comes from user profile)
      const response = await apiClient.post("agents/", {
        agent_name: agentName,
        agent_gender: agentGender,
        agent_description: agentDescription,
        social_media_and_web: (params.socialMediaAndWeb as string) || "",
      });

      if (response.data && response.data.id) {
        const newConfig = {
          id: response.data.id,
          sector: params.sector as string,
          companyName: params.companyName as string,
          socialMediaAndWeb: params.socialMediaAndWeb as string,
          agentGender: agentGender,
          agentName: agentName,
          agentDescription: agentDescription,
        };
        await updateAgentMutation.mutateAsync(newConfig);
      }

      router.replace("/(tabs)/home");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || String(error);
      showError(t("common.error", "Error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const isDisabled = agentName.trim() === "" || isLoading;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
          }}
        >
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.header}
          >
            <Text style={styles.title}>{t("agentSetup.title")}</Text>
            <Text style={styles.subtitle}>{t("agentSetup.subtitle")}</Text>
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
                    onPress={() => setAgentGender("male")}
                  >
                    <View
                      style={[
                        styles.imageContainer,
                        agentGender === "male" && styles.selectedImageContainer,
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
                        agentGender === "male" && styles.selectedGenderText,
                      ]}
                    >
                      {t("agentSetup.masculine")}
                    </Text>
                  </Pressable>
                </Animated.View>

                <Animated.View>
                  <Pressable
                    style={styles.genderButton}
                    onPress={() => setAgentGender("female")}
                  >
                    <View
                      style={[
                        styles.imageContainer,
                        agentGender === "female" &&
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
                        agentGender === "female" && styles.selectedGenderText,
                      ]}
                    >
                      {t("agentSetup.feminine")}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("agentSetup.agentName")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("agentSetup.agentNamePlaceholder")}
                placeholderTextColor="#B0B0B0"
                value={agentName}
                onChangeText={setAgentName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("agentSetup.description")} ({t("common.optional")})
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t("agentSetup.descriptionPlaceholder")}
                placeholderTextColor="#B0B0B0"
                value={agentDescription}
                onChangeText={setAgentDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(600).springify()}
            style={styles.buttonContainer}
          >
            <Pressable
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t("agentSetup.creating") : t("agentSetup.finish")}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: "center",
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
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: "600",
  },
});
