/**
 * InCallView Component
 *
 * Displays the in-call UI with call status, controls, and hang up button
 */

import React, { memo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface CallState {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  isSpeakerOn: boolean;
  remoteParticipant: string | null;
}

interface InCallViewProps {
  callState: CallState;
  formattedDuration: string;
  phoneNumber: string;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onSendDigits?: (digit: string) => void;
}

const DIAL_DIGITS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const InCallView = memo(function InCallView({
  callState,
  formattedDuration,
  phoneNumber,
  onHangUp,
  onToggleMute,
  onToggleSpeaker,
  onSendDigits,
}: InCallViewProps) {
  const { t } = useTranslation();
  const [showDialPad, setShowDialPad] = useState(false);
  const [dtmfInput, setDtmfInput] = useState("");

  const handleDigitPress = (digit: string) => {
    Vibration.vibrate(1);
    setDtmfInput((prev) => prev + digit);
    if (onSendDigits) {
      onSendDigits(digit);
    }
  };

  const getCallStatus = () => {
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

        {/* Dial Pad Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            showDialPad && styles.controlButtonActive,
          ]}
          onPress={() => setShowDialPad(true)}
        >
          <Ionicons
            name="keypad"
            size={28}
            color={showDialPad ? "#fff" : Colors.textSecondary}
          />
          <Text
            style={[
              styles.controlLabel,
              showDialPad && styles.controlLabelActive,
            ]}
          >
            {t("phone.dialPad", "Dial Pad")}
          </Text>
        </TouchableOpacity>

        {/* Speaker Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            callState.isSpeakerOn && styles.controlButtonSpeakerActive,
          ]}
          onPress={onToggleSpeaker}
        >
          <Ionicons
            name={callState.isSpeakerOn ? "volume-high" : "volume-medium"}
            size={28}
            color={callState.isSpeakerOn ? "#fff" : Colors.textSecondary}
          />
          <Text
            style={[
              styles.controlLabel,
              callState.isSpeakerOn && styles.controlLabelActive,
            ]}
          >
            {t("phone.speaker", "Speaker")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hang Up Button */}
      <TouchableOpacity style={styles.hangUpButton} onPress={onHangUp}>
        <Ionicons name="call" size={32} color="#fff" />
      </TouchableOpacity>

      {/* DTMF Dial Pad Modal */}
      <Modal
        visible={showDialPad}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDialPad(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialPadModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("phone.dialPad", "Dial Pad")}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowDialPad(false);
                  setDtmfInput("");
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* DTMF Input Display */}
            <View style={styles.dtmfDisplay}>
              <Text style={styles.dtmfText}>
                {dtmfInput || t("phone.enterDigits", "Enter digits")}
              </Text>
            </View>

            {/* Dial Pad Grid */}
            <View style={styles.dialPadContainer}>
              {DIAL_DIGITS.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.dialRow}>
                  {row.map((digit) => (
                    <TouchableOpacity
                      key={digit}
                      style={styles.dialButton}
                      onPress={() => handleDigitPress(digit)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dialButtonText}>{digit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setShowDialPad(false);
                setDtmfInput("");
              }}
            >
              <Text style={styles.doneButtonText}>
                {t("common.done", "Done")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  controlButtonSpeakerActive: {
    backgroundColor: Colors.success,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  dialPadModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  dtmfDisplay: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dtmfText: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  dialPadContainer: {
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
    backgroundColor: Colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialButtonText: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default InCallView;
