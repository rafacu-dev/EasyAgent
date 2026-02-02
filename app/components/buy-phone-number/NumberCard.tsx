import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import type { AvailableNumber } from "@/app/hooks/useBuyPhoneNumber";

interface NumberCardProps {
  item: AvailableNumber;
  onPurchase: (phoneNumber: string) => void;
  isPurchasing: boolean;
}

export function NumberCard({
  item,
  onPurchase,
  isPurchasing,
}: NumberCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.numberCard}>
      <View style={styles.numberInfo}>
        <View style={styles.numberHeader}>
          <Ionicons
            name="call"
            size={20}
            color={Colors.primary}
            style={styles.numberIcon}
          />
          <Text style={styles.phoneNumber}>{item.phone_number}</Text>
        </View>

        {(item.locality || item.region) && (
          <Text style={styles.numberLocation}>
            {[item.locality, item.region].filter(Boolean).join(", ")}
          </Text>
        )}

        <View style={styles.capabilitiesContainer}>
          {item.capabilities?.voice && (
            <View style={styles.capabilityBadge}>
              <Ionicons name="call" size={12} color={Colors.success} />
              <Text style={styles.capabilityText}>Voice</Text>
            </View>
          )}
          {item.capabilities?.SMS && (
            <View style={styles.capabilityBadge}>
              <Ionicons name="chatbubble" size={12} color={Colors.info} />
              <Text style={styles.capabilityText}>SMS</Text>
            </View>
          )}
          {item.capabilities?.MMS && (
            <View style={styles.capabilityBadge}>
              <Ionicons name="image" size={12} color={Colors.info} />
              <Text style={styles.capabilityText}>MMS</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.buyButton, isPurchasing && styles.buyButtonDisabled]}
        onPress={() => onPurchase(item.phone_number)}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.buyButtonText}>
              {t("getPhone.select", "Select")}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  numberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  numberInfo: {
    flex: 1,
  },
  numberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  numberIcon: {
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  numberLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 28,
  },
  capabilitiesContainer: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 28,
  },
  capabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
  },
  capabilityText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
