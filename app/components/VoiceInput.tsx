/**
 * VoiceInput Component
 * A reusable voice transcription input that can be attached to any text field
 */

import React, { useState, useCallback } from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Colors } from "@/app/utils/colors";
import { transcribeAudio } from "@/app/utils/transcription";
import { showError } from "@/app/utils/toast";

export interface VoiceInputProps {
  /** Callback function to update the input field with transcribed text */
  onTranscription: (text: string) => void;
  /** Whether to append to existing text or replace it */
  appendMode?: boolean;
  /** Current value (used in append mode) */
  currentValue?: string;
  /** Custom size for the button */
  size?: "small" | "medium" | "large";
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom button style */
  buttonStyle?: object;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function VoiceInput({
  onTranscription,
  appendMode = false,
  currentValue = "",
  size = "medium",
  disabled = false,
  buttonStyle,
}: VoiceInputProps) {
  const { t, i18n } = useTranslation();

  // Use i18n language if no language prop is provided
  const transcriptionLanguage = i18n.language;
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation for recording pulse
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const startPulseAnimation = useCallback(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
    );
  }, [scale, opacity]);

  const stopPulseAnimation = useCallback(() => {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(1);
    opacity.value = withTiming(1);
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const startRecording = async () => {
    if (disabled || isProcessing) return;

    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showError(
          t("common.error"),
          t("voiceInput.permissionDenied", "Microphone permission denied"),
        );
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      setIsRecording(true);
      startPulseAnimation();
    } catch (error) {
      console.error("Failed to start recording:", error);
      showError(
        t("common.error"),
        t("voiceInput.startFailed", "Failed to start recording"),
      );
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    stopPulseAnimation();
    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Transcribe the audio
        const result = await transcribeAudio({
          audioUri: uri,
          language: transcriptionLanguage,
        });

        const transcribedText = result.transcription || "";

        if (transcribedText) {
          if (appendMode && currentValue) {
            // Append with a space or newline
            const separator = currentValue.endsWith("\n") ? "" : " ";
            onTranscription(currentValue + separator + transcribedText);
          } else {
            onTranscription(transcribedText);
          }
        } else {
          showError(
            t("common.error"),
            t("voiceInput.noSpeech", "No speech detected"),
          );
        }
      }
    } catch (error: any) {
      console.error("Failed to process recording:", error);
      showError(
        t("common.error"),
        error.message ||
          t("voiceInput.processFailed", "Failed to process audio"),
      );
    } finally {
      setIsProcessing(false);
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const buttonSizes = {
    small: { size: 32, iconSize: 16 },
    medium: { size: 44, iconSize: 22 },
    large: { size: 56, iconSize: 28 },
  };

  const { size: buttonSize, iconSize } = buttonSizes[size];

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        isRecording && styles.recordingButton,
        disabled && styles.disabledButton,
        buttonStyle,
        animatedStyle,
      ]}
      onPress={handlePress}
      disabled={disabled || isProcessing}
      activeOpacity={0.7}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color={Colors.textWhite} />
      ) : (
        <Ionicons
          name={isRecording ? "stop" : "mic"}
          size={iconSize}
          color={Colors.textWhite}
        />
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingButton: {
    backgroundColor: Colors.error,
  },
  disabledButton: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
});

export default VoiceInput;
