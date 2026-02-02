import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { US_CARRIERS } from "@/app/utils/constants";
import { useCallForwarding } from "@/app/hooks/useCallForwarding";
import { CarrierCard } from "@/app/components/call-forwarding";

export default function CallForwardingScreen() {
  const { t } = useTranslation();
  const {
    twilioNumber,
    hasTwilioNumber,
    expandedCarrier,
    setExpandedCarrier,
    handleDial,
    copyTwilioNumber,
    formatCode,
  } = useCallForwarding();

  if (!hasTwilioNumber) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("callForwarding.title", "Call Forwarding")}
          </Text>
        </View>
        <View style={styles.noPhoneContainer}>
          <Ionicons
            name="call-outline"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.noPhoneTitle}>
            {t("callForwarding.noPhoneTitle", "No Phone Number")}
          </Text>
          <Text style={styles.noPhoneMessage}>
            {t(
              "callForwarding.noPhoneMessage",
              "You need a phone number to set up call forwarding"
            )}
          </Text>
          <TouchableOpacity
            style={styles.getPhoneButton}
            onPress={() => router.push("/buy-phone-number")}
          >
            <Text style={styles.getPhoneButtonText}>
              {t("callForwarding.getPhoneNumber", "Get Phone Number")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("callForwarding.title", "Call Forwarding")}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.infoBannerText}>
            {t(
              "callForwarding.infoBanner",
              "Forward calls from your personal phone to your AI agent. When someone calls your personal number, the call will be handled by your AI agent."
            )}
          </Text>
        </View>

        {/* Your Twilio Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("callForwarding.yourAgentNumber", "Your AI Agent Number")}
          </Text>
          <TouchableOpacity
            style={styles.numberCard}
            onPress={copyTwilioNumber}
          >
            <View style={styles.numberInfo}>
              <Ionicons name="call" size={24} color={Colors.primary} />
              <Text style={styles.numberText}>{twilioNumber}</Text>
            </View>
            <Ionicons name="copy-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.sectionHint}>
            {t(
              "callForwarding.numberHint",
              "This is the number you'll forward calls to"
            )}
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("callForwarding.howItWorks", "How It Works")}
          </Text>
          <View style={styles.stepsCard}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {t("callForwarding.step1Title", "Find Your Carrier")}
                </Text>
                <Text style={styles.stepDescription}>
                  {t(
                    "callForwarding.step1Description",
                    "Select your mobile carrier from the list below"
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {t("callForwarding.step2Title", "Dial the Code")}
                </Text>
                <Text style={styles.stepDescription}>
                  {t(
                    "callForwarding.step2Description",
                    "Open your phone's dialer and dial the forwarding code"
                  )}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {t("callForwarding.step3Title", "Confirm Activation")}
                </Text>
                <Text style={styles.stepDescription}>
                  {t(
                    "callForwarding.step3Description",
                    "You'll hear a confirmation tone or receive a message"
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Carrier Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("callForwarding.selectCarrier", "Select Your Carrier")}
          </Text>
          {US_CARRIERS.map((carrier) => (
            <CarrierCard
              key={carrier.id}
              carrier={carrier}
              twilioNumber={twilioNumber}
              onDial={handleDial}
              formatCode={formatCode}
              expanded={expandedCarrier === carrier.id}
              onToggle={() =>
                setExpandedCarrier(
                  expandedCarrier === carrier.id ? null : carrier.id
                )
              }
            />
          ))}
        </View>

        {/* Need Help */}
        <View style={styles.helpSection}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={Colors.textSecondary}
          />
          <Text style={styles.helpText}>
            {t(
              "callForwarding.needHelp",
              "If these codes don't work, contact your carrier's customer service. Some plans may require additional features to enable call forwarding."
            )}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#fdf1e8",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  numberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  numberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  stepsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  step: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noPhoneContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  noPhoneTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  noPhoneMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  getPhoneButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getPhoneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
