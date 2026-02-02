import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import type { USCarrier } from "@/app/utils/types.d";

interface CarrierCardProps {
  carrier: USCarrier;
  twilioNumber: string;
  onDial: (code: string, label: string) => void;
  formatCode: (code: string, number: string) => string;
  expanded: boolean;
  onToggle: () => void;
}

export function CarrierCard({
  carrier,
  twilioNumber,
  onDial,
  formatCode,
  expanded,
  onToggle,
}: CarrierCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.carrierCard}>
      <TouchableOpacity style={styles.carrierHeader} onPress={onToggle}>
        <View style={styles.carrierInfo}>
          <Image
            source={carrier.logo as unknown as ImageSourcePropType}
            style={styles.carrierLogo}
          />
          <Text style={styles.carrierName}>{carrier.name}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.carrierContent}>
          {/* Activate All Calls */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>
              {t("callForwarding.forwardAll", "Forward All Calls")}
            </Text>
            <TouchableOpacity
              style={styles.codeContainer}
              onPress={() =>
                onDial(
                  formatCode(carrier.activateAll, twilioNumber),
                  t("callForwarding.forwardAll", "Forward All Calls"),
                )
              }
            >
              <Text style={styles.codeText}>
                {formatCode(carrier.activateAll, twilioNumber)}
              </Text>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.codeHint}>
              {t(
                "callForwarding.forwardAllHint",
                "Dial this code to forward all incoming calls",
              )}
            </Text>
          </View>

          {/* Deactivate */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>
              {t("callForwarding.deactivate", "Deactivate Forwarding")}
            </Text>
            <TouchableOpacity
              style={styles.codeContainer}
              onPress={() =>
                onDial(
                  carrier.deactivate,
                  t("callForwarding.deactivate", "Deactivate Forwarding"),
                )
              }
            >
              <Text style={styles.codeText}>{carrier.deactivate}</Text>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.codeHint}>
              {t(
                "callForwarding.deactivateHint",
                "Dial this code to stop call forwarding",
              )}
            </Text>
          </View>

          {/* Forward on No Answer */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>
              {t("callForwarding.noAnswer", "Forward When No Answer")}
            </Text>
            <TouchableOpacity
              style={styles.codeContainer}
              onPress={() =>
                onDial(
                  formatCode(carrier.activateNoAnswer, twilioNumber),
                  t("callForwarding.noAnswer", "Forward When No Answer"),
                )
              }
            >
              <Text style={styles.codeText}>
                {formatCode(carrier.activateNoAnswer, twilioNumber)}
              </Text>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.codeHint}>
              {t(
                "callForwarding.noAnswerHint",
                "Forward calls only when you don't answer",
              )}
            </Text>
          </View>

          {/* Forward on Busy */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>
              {t("callForwarding.busy", "Forward When Busy")}
            </Text>
            <TouchableOpacity
              style={styles.codeContainer}
              onPress={() =>
                onDial(
                  formatCode(carrier.activateBusy, twilioNumber),
                  t("callForwarding.busy", "Forward When Busy"),
                )
              }
            >
              <Text style={styles.codeText}>
                {formatCode(carrier.activateBusy, twilioNumber)}
              </Text>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.codeHint}>
              {t(
                "callForwarding.busyHint",
                "Forward calls only when your line is busy",
              )}
            </Text>
          </View>

          {/* Carrier Notes */}
          <View style={styles.notesSection}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.notesText}>
              {t(
                carrier.notes,
                "Dial these codes from your phone's dialer app. Some carriers may require calling customer service to enable call forwarding.",
              )}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carrierCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  carrierHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  carrierInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carrierLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    resizeMode: "contain",
  },
  carrierName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  carrierContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  codeSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: "monospace",
  },
  codeHint: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
