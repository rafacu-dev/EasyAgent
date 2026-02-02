import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { Colors } from "@/app/utils/colors";

interface GenderSelectorProps {
  selectedGender: "male" | "female";
  onSelectGender: (gender: "male" | "female") => void;
}

export function GenderSelector({
  selectedGender,
  onSelectGender,
}: GenderSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.genderContainer}>
        <Animated.View>
          <Pressable
            style={styles.genderButton}
            onPress={() => onSelectGender("male")}
          >
            <View
              style={[
                styles.imageContainer,
                selectedGender === "male" && styles.selectedImageContainer,
              ]}
            >
              <Image
                source={require("@/assets/images/agent-m.jpg")}
                style={styles.genderImage}
              />
            </View>
            <Text
              style={[
                styles.genderText,
                selectedGender === "male" && styles.selectedGenderText,
              ]}
            >
              {t("agentSetup.masculine", "Masculine")}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View>
          <Pressable
            style={styles.genderButton}
            onPress={() => onSelectGender("female")}
          >
            <View
              style={[
                styles.imageContainer,
                selectedGender === "female" && styles.selectedImageContainer,
              ]}
            >
              <Image
                source={require("@/assets/images/agent-f.jpg")}
                style={styles.genderImage}
              />
            </View>
            <Text
              style={[
                styles.genderText,
                selectedGender === "female" && styles.selectedGenderText,
              ]}
            >
              {t("agentSetup.feminine", "Feminine")}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  genderButton: {
    alignItems: "center",
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  selectedImageContainer: {
    borderColor: Colors.primary,
    borderWidth: 4,
  },
  genderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  genderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  selectedGenderText: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
