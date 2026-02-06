/**
 * Phone Screen
 *
 * Main phone interface for making AI agent calls and direct calls
 * Uses usePhone hook for state management and phone components for UI
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/app/utils/colors";
import { usePhone } from "@/app/hooks/usePhone";
import NoPhoneNumber from "@/app/components/NoPhoneNumber";
import { ContactPicker } from "@/app/components/ContactPicker";
import {
  DialPad,
  InCallView,
  PhoneDisplay,
  AgentPromptInput,
  CallModeSwitch,
} from "@/app/components/phone";

export default function PhoneScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ phoneNumber?: string }>();

  const {
    // Data
    agentConfig,
    phoneNumber,
    isLoadingAgent,
    isLoadingPhone,

    // Phone Input
    phoneNumberInput,
    setPhoneNumberInput,
    handleDigitPress,
    handleBackspace,
    handleClear,

    // Call Mode
    isAgentMode,
    setIsAgentMode,
    callPrompt,
    setCallPrompt,

    // Call Actions
    isLoading,
    handleMakeCall,

    // Voice SDK
    callState,
    formattedDuration,
    hangUp,
    toggleMute,
    toggleSpeaker,
    sendDigits,

    // Contact Picker
    showContactsModal,
    setShowContactsModal,
    handleSelectContact,

    // Info Modal
    showInfoModal,
    setShowInfoModal,
  } = usePhone();

  // Set phone number from navigation params if provided
  useEffect(() => {
    if (params.phoneNumber) {
      setPhoneNumberInput(params.phoneNumber);
    }
  }, [params.phoneNumber, setPhoneNumberInput]);

  // Show loading state
  if (isLoadingAgent || isLoadingPhone) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("phone.loading", "Loading...")}
          </Text>
        </View>
      </View>
    );
  }

  // No phone number configured
  if (!phoneNumber) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("phone.subtitle", "Make calls with your AI agent")}
          </Text>
        </View>
        <NoPhoneNumber />
      </View>
    );
  }

  // In-call UI
  if (callState.isConnecting || callState.isConnected) {
    return (
      <InCallView
        callState={callState}
        formattedDuration={formattedDuration}
        phoneNumber={phoneNumberInput}
        onHangUp={hangUp}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onSendDigits={sendDigits}
      />
    );
  }

  // Main phone UI
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
            <Text style={styles.headerSubtitle}>
              {t("phone.subtitle", "Make calls with your AI agent")}
            </Text>
          </View>

          {/* Call Mode Switch */}
          <CallModeSwitch
            isAgentMode={isAgentMode}
            onToggle={setIsAgentMode}
            showInfoModal={showInfoModal}
            onOpenInfo={() => setShowInfoModal(true)}
            onCloseInfo={() => setShowInfoModal(false)}
          />
          {/* Agent Prompt Input (only shown in agent mode) */}
          {isAgentMode && (
            <AgentPromptInput
              value={callPrompt}
              onChangeText={setCallPrompt}
              language={agentConfig?.language}
            />
          )}
          {/* Phone Number Display */}
          <PhoneDisplay
            phoneNumber={phoneNumberInput}
            onClear={handleClear}
            onOpenContacts={() => setShowContactsModal(true)}
            onChange={setPhoneNumberInput}
          />
        </ScrollView>

        {/* Dial Pad */}
        <DialPad
          onDigitPress={handleDigitPress}
          onBackspace={handleBackspace}
          onCall={handleMakeCall}
          isLoading={isLoading}
        />

        {/* Contacts Picker */}
        <ContactPicker
          visible={showContactsModal}
          onClose={() => setShowContactsModal(false)}
          onSelectContact={handleSelectContact}
          title={t("phone.selectContact", "Select Contact")}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
