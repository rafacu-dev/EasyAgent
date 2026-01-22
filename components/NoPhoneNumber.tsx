import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { Colors } from "../utils/colors";
import { useUserQuery } from "../utils/hooks";
import { showWarning } from "../utils/toast";

interface NoPhoneNumberProps {
  variant?: "simple" | "detailed";
  translationPrefix?: string;
}

export default function NoPhoneNumber({
  variant = "simple",
  translationPrefix = "home",
}: NoPhoneNumberProps) {
  const { t } = useTranslation();
  const { isProOrAbove } = useUserQuery();

  const handleBuyPhoneNumber = () => {
    if (!isProOrAbove) {
      showWarning(
        t("subscription.proFeature", "Pro Feature"),
        t(
          "subscription.phoneNumberProMessage",
          "Phone numbers are a Pro feature. Upgrade to access this feature.",
        ),
      );
      setTimeout(() => {
        router.push("/paywall/PaywallScreen");
      }, 1500);
    } else {
      router.push("/buy-phone-number");
    }
  };

  if (variant === "detailed") {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="call-outline" size={120} color={Colors.primary} />
        </View>
        <Text style={styles.title}>
          {t(`${translationPrefix}.noPhoneTitle`, "No Phone Number")}
        </Text>
        <Text style={styles.message}>
          {t(
            `${translationPrefix}.noPhoneMessage`,
            "To access calls and records, first buy a phone number for your agent",
          )}
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
            <Text style={styles.featureText}>
              {t(
                `${translationPrefix}.featureInbound`,
                "Receive inbound calls",
              )}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
            <Text style={styles.featureText}>
              {t(`${translationPrefix}.featureOutbound`, "Make outbound calls")}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.success}
            />
            <Text style={styles.featureText}>
              {t(
                `${translationPrefix}.featureRecording`,
                "Call recording & transcripts",
              )}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={handleBuyPhoneNumber}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.buyButtonText}>
            {t(`${translationPrefix}.getPhoneNumber`, "Get Phone Number")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Simple variant
  return (
    <View style={styles.containerSimple}>
      <Ionicons name="call-outline" size={80} color={Colors.textLight} />
      <Text style={styles.titleSimple}>
        {t(`${translationPrefix}.noPhoneTitle`, "No Phone Number")}
      </Text>
      <Text style={styles.messageSimple}>
        {t(
          `${translationPrefix}.noPhoneMessage`,
          "To access calls and records, first buy a phone number for your agent",
        )}
      </Text>
      <TouchableOpacity
        style={styles.buyButtonSimple}
        onPress={handleBuyPhoneNumber}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.buyButtonTextSimple}>
          {t(`${translationPrefix}.getPhoneNumber`, "Get Phone Number")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Detailed variant styles
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginLeft: 12,
    fontWeight: "500",
  },
  buyButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  pricingText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 16,
    textAlign: "center",
  },

  // Simple variant styles
  containerSimple: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    paddingTop: 48,
  },
  titleSimple: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  messageSimple: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buyButtonSimple: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonTextSimple: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
