/**
 * DialPad Component
 *
 * A numeric dial pad for phone number input and in-call DTMF
 */

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";

interface DialPadProps {
  onDigitPress: (digit: string) => void;
  onBackspace?: () => void;
  onCall: () => void;
  isLoading?: boolean;
  showBackspace?: boolean;
}

const DIAL_DIGITS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const DialPad = memo(function DialPad({
  onDigitPress,
  onBackspace,
  onCall,
  isLoading = false,
  showBackspace = true,
}: DialPadProps) {
  const handleDigitPress = (digit: string) => {
    Vibration.vibrate(1);
    onDigitPress(digit);
  };

  return (
    <View style={styles.dialPad}>
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

      {/* Bottom row: backspace, call, placeholder */}
      <View style={styles.dialRow}>
        {/* Placeholder for symmetry */}
        <View style={styles.placeholderButton} />

        {/* Call button */}
        <TouchableOpacity
          style={[styles.dialButton, styles.callButton]}
          onPress={onCall}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Backspace button */}
        {showBackspace && onBackspace ? (
          <TouchableOpacity
            style={styles.backspaceButton}
            onPress={onBackspace}
            onLongPress={onBackspace}
            activeOpacity={0.7}
          >
            <Ionicons
              name="backspace-outline"
              size={28}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderButton} />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dialPad: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 16,
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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dialButtonText: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  callButton: {
    backgroundColor: Colors.success,
  },
  backspaceButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderButton: {
    width: 72,
    height: 72,
  },
});

export default DialPad;
