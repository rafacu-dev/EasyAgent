/**
 * PhoneDisplay Component
 *
 * Displays the phone number input with placeholder and clear button
 */

import { memo } from "react";
import { View, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface PhoneDisplayProps {
  phoneNumber: string;
  onClear: () => void;
  onOpenContacts: () => void;
  onChange: (text: string) => void;
  placeholder?: string;
}

export const PhoneDisplay = memo(function PhoneDisplay({
  phoneNumber,
  onClear,
  onOpenContacts,
  onChange,
  placeholder,
}: PhoneDisplayProps) {
  const { t } = useTranslation();
  const displayPlaceholder =
    placeholder || t("phone.enterNumber", "Enter phone number");

  return (
    <View style={styles.container}>
      {/* Clear button - left side */}
      <View style={styles.buttonContainer}>
        {phoneNumber.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onClear}
            activeOpacity={0.7}
          >
            <Ionicons
              name="backspace-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Phone number input */}
      <View style={styles.inputArea}>
        <TextInput
          style={[
            styles.phoneInput,
            !phoneNumber && styles.phoneInputPlaceholder,
          ]}
          value={phoneNumber}
          onChangeText={onChange}
          placeholder={displayPlaceholder}
          placeholderTextColor={Colors.textLight}
          keyboardType="phone-pad"
          textAlign="center"
          maxLength={20}
        />
      </View>

      {/* Contact picker button - right side */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpenContacts}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="contacts-outline"
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputArea: {
    flex: 1,
    flexDirection: "column",
  },
  phoneInput: {
    width: "100%",
    fontSize: 32,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: "center",
    paddingVertical: 0,
  },
  phoneInputPlaceholder: {
    fontSize: 20,
    fontWeight: "600",
  },
});

export default PhoneDisplay;
