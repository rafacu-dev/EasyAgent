/**
 * InCallView Component
 *
 * Displays the in-call UI with call status, controls, and hang up button
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface CallState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  isSpeaker: boolean;
  remoteParticipant: string | null;
}

interface InCallViewProps {
  callState: CallState;
  formattedDuration: string;
  phoneNumber: string;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onToggleSpeaker: () => void;
}

export const InCallView = memo(function InCallView({
  callState,
  formattedDuration,
  phoneNumber,
  onHangUp,
  onToggleMute,
  onToggleHold,
  onToggleSpeaker,
}: InCallViewProps) {
  const { t } = useTranslation();

  const getCallStatus = () => {
    if (callState.isOnHold) {
      return t("phone.onHold", "On Hold");
    }
    if (callState.isConnecting) {
      return t("phone.connecting", "Connecting...");
    }
    if (callState.isConnected) {
      return t("phone.connected", "Connected");
    }
    return t("phone.calling", "Calling...");
  };

  return (
    <View style={styles.container}>
      {/* Call Status Header */}
      <View style={styles.header}>
        <Text style={styles.status}>{getCallStatus()}</Text>
        <Text style={styles.phoneNumber}>
          {callState.remoteParticipant || phoneNumber}
        </Text>
        {callState.isConnected && (
          <Text style={styles.duration}>{formattedDuration}</Text>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            callState.isMuted && styles.controlButtonActive,
          ]}
          onPress={onToggleMute}
        >
          <Ionicons
            name={callState.isMuted ? "mic-off" : "mic"}
            size={28}
            color={callState.isMuted ? "#fff" : Colors.textSecondary}
          />
          <Text
            style={[
              styles.controlLabel,
              callState.isMuted && styles.controlLabelActive,
            ]}
          >
            {t("phone.mute", "Mute")}
          </Text>
        </TouchableOpacity>

        {/* Speaker Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            callState.isSpeaker && styles.controlButtonActive,
          ]}
          onPress={onToggleSpeaker}
        >
          <Ionicons
            name={callState.isSpeaker ? "volume-high" : "volume-medium"}
            size={28}
            color={callState.isSpeaker ? "#fff" : Colors.textSecondary}
          />
          <Text
            style={[
              styles.controlLabel,
              callState.isSpeaker && styles.controlLabelActive,
            ]}
          >
            {t("phone.speaker", "Speaker")}
          </Text>
        </TouchableOpacity>

        {/* Hold Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            callState.isOnHold && styles.controlButtonActive,
          ]}
          onPress={onToggleHold}
        >
          <Ionicons
            name={callState.isOnHold ? "pause" : "pause-outline"}
            size={28}
            color={callState.isOnHold ? "#fff" : Colors.textSecondary}
          />
          <Text
            style={[
              styles.controlLabel,
              callState.isOnHold && styles.controlLabelActive,
            ]}
          >
            {t("phone.hold", "Hold")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hang Up Button */}
      <TouchableOpacity style={styles.hangUpButton} onPress={onHangUp}>
        <Ionicons name="call" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  status: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  phoneNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  duration: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 16,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 16,
  },
  controlButton: {
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
  controlButtonActive: {
    backgroundColor: Colors.primary,
  },
  controlLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  controlLabelActive: {
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
});

export default InCallView;
