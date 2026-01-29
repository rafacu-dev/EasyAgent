import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  FlatList,
} from "react-native";
import { Colors } from "@/app/utils/colors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useEffect } from "react";
import {
  useAgentQuery,
  useAgentPhoneNumber,
  useVoiceCall,
} from "@/app/utils/hooks";
import NoPhoneNumber from "../components/NoPhoneNumber";
import { apiClient } from "@/app/utils/axios-interceptor";
import { formatPhoneNumber } from "@/app/utils/formatters";
import { Audio } from "expo-av";
import { transcribeAudio, getTextFromResult } from "@/app/utils/transcription";
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
} from "@/app/utils/toast";

interface Contact {
  id: number;
  name: string;
  phone_number: string;
  notes?: string;
}

export default function PhoneScreen() {
  const { t } = useTranslation();
  const { data: agentConfig, isLoading: isLoadingAgent } = useAgentQuery();
  const { phoneNumber, isLoading: isLoadingPhone } = useAgentPhoneNumber(
    agentConfig?.id,
  );
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [isAgentMode, setIsAgentMode] = useState(true); // Toggle between manual/agent call
  const [callPrompt, setCallPrompt] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");

  // Voice SDK hook for direct calls
  const {
    isSDKAvailable,
    callState,
    formattedDuration,
    makeCall,
    hangUp,
    toggleMute,
    toggleHold,
    toggleSpeaker,
    sendDigits,
  } = useVoiceCall({
    fromNumber: phoneNumber || null,
  });

  const handleDigitPress = useCallback(
    (digit: string) => {
      // If in a call, send DTMF digit
      if (callState.isConnected) {
        sendDigits(digit);
      } else {
        setPhoneNumberInput((prev) => prev + digit);
      }
    },
    [callState.isConnected, sendDigits],
  );

  const handleBackspace = () => {
    setPhoneNumberInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumberInput("");
  };

  const fetchContacts = async (search?: string) => {
    setIsLoadingContacts(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await apiClient.get(`contacts/${params}`);
      setContacts(response.data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      showError(t("phone.error", "Error"), "Failed to load contacts");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (showContactsModal) {
      fetchContacts(contactSearchQuery);
    }
  }, [showContactsModal, contactSearchQuery]);

  const handleSelectContact = (contact: Contact) => {
    setPhoneNumberInput(contact.phone_number);
    setShowContactsModal(false);
    setContactSearchQuery("");
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== "granted") {
        showError(
          t("phone.permissionDenied", "Permission Denied"),
          t("phone.microphonePermission", "Microphone access is required"),
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      if (__DEV__) console.error("Recording error:", err);
      showError(
        t("phone.error", "Error"),
        t("phone.recordingFailed", "Failed to start recording"),
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    setRecording(null);

    if (__DEV__) console.log("Recording stopped, URI:", uri);

    if (!uri) {
      showError(
        t("phone.error", "Error"),
        t("phone.recordingFailed", "Failed to save recording"),
      );
      return;
    }

    // Send audio to backend for transcription
    setIsTranscribing(true);
    try {
      // Option 1: Use the utility function (recommended)
      const result = await transcribeAudio({
        audioUri: uri,
        language: "es", // Spanish by default
        translate: false, // Set to true for translation
        // targetLanguage: "en", // Only needed if translate is true
      });
      console.log("result from transcription:", result);
      const text = getTextFromResult(result);

      if (__DEV__) {
        console.log("Transcription result:", result);
        console.log("Method used:", result.method);
        console.log("Text:", text);
      }

      if (text) {
        // Append to existing prompt or set new one
        setCallPrompt((prev) => (prev ? `${prev} ${text}` : text));
      } else {
        showInfo(
          t("phone.info", "Info"),
          t("phone.noTranscription", "No speech detected in the recording"),
        );
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      showError(
        t("phone.error", "Error"),
        error.message ||
          t("phone.transcriptionFailed", "Failed to transcribe audio"),
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Loading state - wait for both agent config and phone number
  if (isLoadingAgent || isLoadingPhone || !agentConfig) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 16, color: Colors.textSecondary }}>
            {t("phone.loading", "Loading phone...")}
          </Text>
        </View>
      </View>
    );
  }

  const handleMakeCall = async () => {
    if (!phoneNumberInput || phoneNumberInput.length < 10) {
      showError(
        t("phone.error", "Error"),
        t("phone.invalidNumber", "Please enter a valid phone number"),
      );
      return;
    }

    if (isAgentMode && !callPrompt.trim()) {
      showError(
        t("phone.error", "Error"),
        t("phone.promptRequired", "Please enter instructions for the agent"),
      );
      return;
    }

    // Format numbers for display and API
    const formattedInput = formatPhoneNumber(phoneNumberInput);

    // Show confirmation dialog before making the call
    Alert.alert(
      t("phone.confirmCallTitle", "Confirm Call"),
      t("phone.confirmCallMessage", `Do you want to call ${formattedInput}?`),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("common.call", "Call"),
          onPress: () => executeCall(formattedInput),
        },
      ],
    );
  };

  const executeCall = async (formattedInput: string) => {
    setIsLoading(true);
    try {
      if (isAgentMode) {
        // AI Agent call
        await apiClient.post("calls/create-phone-call/", {
          agent_id: agentConfig?.id,
          from_number: phoneNumber,
          to_number: formattedInput,
          call_prompt: callPrompt,
        });
        showSuccess(
          t("phone.success", "Success"),
          t("phone.agentCallInitiated", "AI agent call initiated successfully"),
        );
        setPhoneNumberInput("");
        setCallPrompt("");
      } else {
        // Direct call via Voice SDK
        if (isSDKAvailable) {
          const success = await makeCall(formattedInput);
          if (success) {
            // Don't clear inputs yet - show in-call UI
          }
        } else {
          // Fallback: Voice SDK not available
          showWarning(
            t("phone.sdkNotAvailable", "Voice Calling Unavailable"),
            t(
              "phone.sdkNotAvailableMessage",
              "Direct calling requires native modules. Please use AI Agent mode or rebuild the app with native support.",
            ),
          );
        }
      }
    } catch (error: any) {
      showError(
        t("phone.error", "Error"),
        error.response?.data?.error ||
          t("phone.callFailed", "Failed to initiate call"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // No phone number view
  if (!phoneNumber) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
            <Text style={styles.headerSubtitle}>
              {t("phone.subtitle", "Make calls with your AI agent")}
            </Text>
          </View>
          <NoPhoneNumber variant="detailed" translationPrefix="phone" />
        </ScrollView>
      </View>
    );
  }

  // In-Call UI - show when call is connecting or connected
  if (callState.isConnecting || callState.isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.inCallContainer}>
          {/* Call Status */}
          <View style={styles.inCallHeader}>
            <Text style={styles.inCallStatus}>
              {callState.isConnecting
                ? t("phone.connecting", "Connecting...")
                : t("phone.inCall", "In Call")}
            </Text>
            <Text style={styles.inCallNumber}>
              {callState.remoteParty || phoneNumberInput}
            </Text>
            {callState.isConnected && (
              <Text style={styles.inCallDuration}>{formattedDuration}</Text>
            )}
          </View>

          {/* Call Controls */}
          <View style={styles.inCallControls}>
            <TouchableOpacity
              style={[
                styles.inCallButton,
                callState.isMuted && styles.inCallButtonActive,
              ]}
              onPress={toggleMute}
              disabled={!callState.isConnected}
            >
              <Ionicons
                name={callState.isMuted ? "mic-off" : "mic"}
                size={28}
                color={callState.isMuted ? "#fff" : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.inCallButtonLabel,
                  callState.isMuted && styles.inCallButtonLabelActive,
                ]}
              >
                {t("phone.mute", "Mute")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inCallButton,
                callState.isSpeakerOn && styles.inCallButtonActive,
              ]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={callState.isSpeakerOn ? "volume-high" : "volume-low"}
                size={28}
                color={callState.isSpeakerOn ? "#fff" : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.inCallButtonLabel,
                  callState.isSpeakerOn && styles.inCallButtonLabelActive,
                ]}
              >
                {t("phone.speaker", "Speaker")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inCallButton,
                callState.isOnHold && styles.inCallButtonActive,
              ]}
              onPress={toggleHold}
              disabled={!callState.isConnected}
            >
              <Ionicons
                name={callState.isOnHold ? "play" : "pause"}
                size={28}
                color={callState.isOnHold ? "#fff" : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.inCallButtonLabel,
                  callState.isOnHold && styles.inCallButtonLabelActive,
                ]}
              >
                {t("phone.hold", "Hold")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hang Up Button */}
          <TouchableOpacity style={styles.hangUpButton} onPress={hangUp}>
            <Ionicons name="call" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main phone UI
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 0 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
          </View>

          {/* Call Mode Switch */}
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelRow}>
              <Text style={styles.switchLabel}>
                {isAgentMode
                  ? t("phone.agentMode", "AI Agent Call")
                  : t("phone.manualMode", "Direct Call")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfoModal(true)}
                style={styles.infoButton}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
            <Switch
              value={isAgentMode}
              onValueChange={setIsAgentMode}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor="#fff"
              style={{
                width: 40,
                height: 20,
                transform: [{ scaleX: 0.9 }, { scaleY: 0.8 }],
              }}
            />
          </View>

          {/* Agent Prompt Input (conditional) */}
          {isAgentMode && (
            <View style={styles.promptContainer}>
              <View style={styles.promptHeaderRow}>
                <Text style={styles.promptLabel}>
                  {t("phone.agentInstructions", "Instructions for AI Agent")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.microphoneButton,
                    isRecording && styles.microphoneButtonActive,
                    isTranscribing && styles.microphoneButtonDisabled,
                  ]}
                  onPress={toggleRecording}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons
                      name={isRecording ? "stop-circle" : "mic"}
                      size={20}
                      color={isRecording ? "#fff" : Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.promptInput}
                placeholder={
                  isTranscribing
                    ? t("phone.transcribing", "Transcribing audio...")
                    : t(
                        "phone.promptPlaceholder",
                        "E.g., Schedule an appointment for next week...",
                      )
                }
                placeholderTextColor={Colors.textLight}
                value={callPrompt}
                onChangeText={setCallPrompt}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isTranscribing}
              />
              {isRecording && (
                <Text style={styles.recordingIndicator}>
                  {t("phone.recording", "🔴 Recording...")}
                </Text>
              )}
              {isTranscribing && (
                <View style={styles.transcribingIndicator}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.transcribingText}>
                    {t("phone.transcribingAudio", "Transcribing audio...")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Phone Number Display */}
          <View style={styles.displayContainer}>
            <View style={styles.displayHeader}>
              <TouchableOpacity
                onPress={() => setShowContactsModal(true)}
                style={styles.contactButton}
              >
                <Ionicons
                  name="people-outline"
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
            {phoneNumberInput.length === 0 && (
              <Text style={styles.placeholderText}>
                {t("phone.enterNumber", "Enter Phone Number")}
              </Text>
            )}
            <TextInput
              style={[
                styles.displayText,
                phoneNumberInput.length === 0 && styles.displayTextEmpty,
              ]}
              value={phoneNumberInput}
              onChangeText={setPhoneNumberInput}
              placeholder=""
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              selectTextOnFocus
              maxLength={20}
              autoCorrect={false}
              autoCapitalize="none"
              textAlign="center"
              returnKeyType="done"
            />
            {phoneNumberInput.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Custom Dial Pad */}
        <View style={styles.dialPad}>
          <View style={styles.dialRow}>
            {["1", "2", "3"].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.dialButton}
                onPress={() => handleDigitPress(digit)}
              >
                <Text style={styles.dialButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dialRow}>
            {["4", "5", "6"].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.dialButton}
                onPress={() => handleDigitPress(digit)}
              >
                <Text style={styles.dialButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dialRow}>
            {["7", "8", "9"].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.dialButton}
                onPress={() => handleDigitPress(digit)}
              >
                <Text style={styles.dialButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dialRow}>
            <TouchableOpacity
              style={styles.dialButton}
              onPress={() => handleDigitPress("*")}
            >
              <Text style={styles.dialButtonText}>*</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialButton}
              onPress={() => handleDigitPress("0")}
            >
              <Text style={styles.dialButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialButton}
              onPress={() => handleDigitPress("#")}
            >
              <Text style={styles.dialButtonText}>#</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dialRow}>
            <TouchableOpacity
              style={styles.dialButton}
              onPress={() => handleDigitPress("+")}
            >
              <Text style={styles.dialButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialButton, styles.callButtonDial]}
              onPress={handleMakeCall}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="call" size={28} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialButton}
              onPress={handleBackspace}
            >
              <Ionicons
                name="backspace-outline"
                size={24}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Modal */}
        <Modal
          visible={showInfoModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowInfoModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons
                  name="information-circle"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.modalTitle}>
                  {t("phone.infoTitle", "Call Modes")}
                </Text>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>
                    {t("phone.agentMode", "AI Agent Call")}
                  </Text>
                  <Text style={styles.infoSectionText}>
                    {t(
                      "phone.agentModeInfo",
                      "Your AI agent will make the call and follow the instructions you provide. Perfect for automated appointment scheduling, customer follow-ups, and more.",
                    )}
                  </Text>
                </View>
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>
                    {t("phone.manualMode", "Direct Call")}
                  </Text>
                  <Text style={styles.infoSectionText}>
                    {t(
                      "phone.manualModeInfo",
                      "Make a direct call where you speak personally using your configured phone number.",
                    )}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>
                  {t("phone.modalClose", "Close")}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Contacts Modal */}
        <Modal
          visible={showContactsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowContactsModal(false)}
        >
          <View style={styles.contactsModalOverlay}>
            <View style={styles.contactsModalContent}>
              <View style={styles.contactsModalHeader}>
                <Text style={styles.contactsModalTitle}>Select Contact</Text>
                <TouchableOpacity
                  onPress={() => setShowContactsModal(false)}
                  style={styles.contactsModalCloseButton}
                >
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.contactsSearchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={Colors.textLight}
                  style={styles.contactsSearchIcon}
                />
                <TextInput
                  style={styles.contactsSearchInput}
                  placeholder="Search contacts..."
                  placeholderTextColor={Colors.textLight}
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                />
                {contactSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setContactSearchQuery("")}
                    style={styles.contactsSearchClear}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={Colors.textLight}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Contacts List */}
              {isLoadingContacts ? (
                <View style={styles.contactsLoadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : contacts.length === 0 ? (
                <View style={styles.contactsEmptyContainer}>
                  <Ionicons
                    name="people-outline"
                    size={64}
                    color={Colors.textLight}
                  />
                  <Text style={styles.contactsEmptyText}>
                    No contacts found
                  </Text>
                  <Text style={styles.contactsEmptySubtext}>
                    {contactSearchQuery
                      ? "Try a different search"
                      : "Add contacts to see them here"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={contacts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.contactItem}
                      onPress={() => handleSelectContact(item)}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{item.name}</Text>
                        <Text style={styles.contactPhone}>
                          {item.phone_number}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={Colors.textLight}
                      />
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.contactsList}
                />
              )}
            </View>
          </View>
        </Modal>
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
  switchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    width: "auto",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8, // reduced vertical padding
    paddingHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40, // ensure enough height for the larger switch
  },
  switchLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  infoButton: {
    padding: 4,
  },
  displayContainer: {
    paddingVertical: 10,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    position: "relative",
  },
  placeholderText: {
    position: "absolute",
    fontSize: 24,
    color: Colors.textLight,
    textAlign: "center",
    pointerEvents: "none",
  },
  displayText: {
    fontSize: 38,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: "center",
  },
  displayTextEmpty: {
    width: "100%",
    color: "transparent",
  },
  clearButton: {
    padding: 4,
  },
  promptContainer: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promptHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  microphoneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  microphoneButtonActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  microphoneButtonDisabled: {
    opacity: 0.5,
  },
  recordingIndicator: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  transcribingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  transcribingText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  promptInput: {
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dialPad: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dialRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 12,
  },
  dialButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dialButtonText: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  callButtonDial: {
    backgroundColor: Colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    flex: 1,
  },
  modalBody: {
    gap: 16,
  },
  infoSection: {
    gap: 8,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  infoSectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // In-Call UI Styles
  inCallContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  inCallHeader: {
    alignItems: "center",
    gap: 8,
  },
  inCallStatus: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  inCallNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  inCallDuration: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 16,
  },
  inCallControls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 16,
  },
  inCallButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inCallButtonActive: {
    backgroundColor: Colors.primary,
  },
  inCallButtonLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inCallButtonLabelActive: {
    color: "#fff",
  },
  hangUpButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "135deg" }],
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  displayHeader: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  // Contacts Modal Styles
  contactsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  contactsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    paddingTop: 16,
  },
  contactsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  contactsModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  contactsModalCloseButton: {
    padding: 4,
  },
  contactsSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactsSearchIcon: {
    marginRight: 8,
  },
  contactsSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  contactsSearchClear: {
    padding: 4,
  },
  contactsLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contactsEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  contactsEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 16,
  },
  contactsEmptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: "center",
  },
  contactsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
