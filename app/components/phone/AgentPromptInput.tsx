/**
 * AgentPromptInput Component
 *
 * Text input for AI agent call instructions with voice recording support
 */

import React, { memo } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { VoiceInput } from "@/app/components/VoiceInput";

interface AgentPromptInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  language?: string;
}

export const AgentPromptInput = memo(function AgentPromptInput({
  value,
  onChangeText,
  placeholder,
  language,
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
      {/* Header with label and voice input button */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {t("phone.promptLabel", "Instructions for the agent")}
        </Text>
        <VoiceInput
          onTranscription={onChangeText}
          currentValue={value}
          appendMode={true}
          size="small"
          language={language}
        />
      </View>

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
