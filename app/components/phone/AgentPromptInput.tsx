/**
 * AgentPromptInput Component
 *
 * Text input for AI agent call instructions with voice recording support
 */

import React, { memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface AgentPromptInputProps {
  value: string;
  onChangeText: (text: string) => void;
  isRecording: boolean;
  isTranscribing: boolean;
  onToggleRecording: () => void;
  placeholder?: string;
}

export const AgentPromptInput = memo(function AgentPromptInput({
  value,
  onChangeText,
  isRecording,
  isTranscribing,
  onToggleRecording,
  placeholder,
}: AgentPromptInputProps) {
  const { t } = useTranslation();
  const defaultPlaceholder =
    placeholder ||
    t(
      "phone.promptPlaceholder",
      "e.g., Schedule an appointment for next week...",
    );

  return (
    <View style={styles.container}>
      {/* Header with label and microphone button */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {t("phone.promptLabel", "Instructions for the agent")}
        </Text>
        <TouchableOpacity
          style={[
            styles.microphoneButton,
            isRecording && styles.microphoneButtonActive,
            isTranscribing && styles.microphoneButtonDisabled,
          ]}
          onPress={onToggleRecording}
          disabled={isTranscribing}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={18}
            color={isRecording ? "#fff" : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <Text style={styles.recordingIndicator}>
          {t("phone.recording", "Recording...")}
        </Text>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <View style={styles.transcribingIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.transcribingText}>
            {t("phone.transcribing", "Transcribing...")}
          </Text>
        </View>
      )}

      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder={defaultPlaceholder}
        placeholderTextColor={Colors.textLight}
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
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
  input: {
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});

export default AgentPromptInput;
