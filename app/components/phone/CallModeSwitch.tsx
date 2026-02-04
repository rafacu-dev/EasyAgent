/**
 * CallModeSwitch Component
 *
 * Toggle switch for selecting between AI Agent and Direct call modes
 */

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface CallModeSwitchProps {
  isAgentMode: boolean;
  onToggle: (value: boolean) => void;
  showInfoModal: boolean;
  onOpenInfo: () => void;
  onCloseInfo: () => void;
}

export const CallModeSwitch = memo(function CallModeSwitch({
  isAgentMode,
  onToggle,
  showInfoModal,
  onOpenInfo,
  onCloseInfo,
}: CallModeSwitchProps) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.container}>
        <View style={styles.labelRow}>
          <Ionicons name={"sparkles"} size={20} color={Colors.primary} />
          <Text style={styles.label}>
            {t("phone.agentMode", "AI Agent Call")}
          </Text>
          <TouchableOpacity style={styles.infoButton} onPress={onOpenInfo}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <Switch
          value={isAgentMode}
          onValueChange={onToggle}
          trackColor={{ false: Colors.borderLight, true: Colors.primary }}
          thumbColor="#fff"
          ios_backgroundColor={Colors.borderLight}
        />
      </View>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseInfo}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseInfo}
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
              onPress={onCloseInfo}
            >
              <Text style={styles.modalCloseButtonText}>
                {t("phone.modalClose", "Close")}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    width: "auto",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  infoButton: {
    padding: 4,
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
});

export default CallModeSwitch;
