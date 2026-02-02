/**
 * PhoneDisplay Component
 *
 * Displays the phone number input with placeholder and clear button
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { formatPhoneNumber } from "@/app/utils/formatters";

interface PhoneDisplayProps {
  phoneNumber: string;
  onClear: () => void;
  onOpenContacts: () => void;
  placeholder?: string;
}

export const PhoneDisplay = memo(function PhoneDisplay({
  phoneNumber,
  onClear,
  onOpenContacts,
  placeholder,
}: PhoneDisplayProps) {
  const { t } = useTranslation();
  const displayPlaceholder =
    placeholder || t("phone.enterNumber", "Enter phone number");
  const formattedNumber = phoneNumber ? formatPhoneNumber(phoneNumber) : "";

  return (
    <View style={styles.container}>
      {/* Contact picker button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={onOpenContacts}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Phone number display */}
      <View style={styles.displayArea}>
        {!phoneNumber && (
          <Text style={styles.placeholder}>{displayPlaceholder}</Text>
        )}
        <Text
          style={[styles.phoneNumber, !phoneNumber && styles.phoneNumberEmpty]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formattedNumber || " "}
        </Text>
      </View>

      {/* Clear button */}
      {phoneNumber.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    position: "relative",
  },
  header: {
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
  displayArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    position: "absolute",
    fontSize: 24,
    color: Colors.textLight,
    textAlign: "center",
    pointerEvents: "none",
  },
  phoneNumber: {
    fontSize: 38,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: "center",
  },
  phoneNumberEmpty: {
    width: "100%",
    color: "transparent",
  },
  clearButton: {
    padding: 4,
    position: "absolute",
    left: 16,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
});

export default PhoneDisplay;
