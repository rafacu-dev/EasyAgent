import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "./colors";

/**
 * Custom Toast Configuration
 * Beautiful, prominent toast notifications with icons
 */

interface ToastProps {
  text1?: string;
  text2?: string;
  props?: any;
}

const ToastBase = ({
  text1,
  text2,
  iconName,
  iconColor,
  backgroundColor,
  borderColor,
}: ToastProps & {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
}) => (
  <View style={[styles.container, { backgroundColor, borderColor }]}>
    <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
      <Ionicons name={iconName} size={24} color="#FFFFFF" />
    </View>
    <View style={styles.textContainer}>
      {text1 && (
        <Text style={styles.title} numberOfLines={1}>
          {text1}
        </Text>
      )}
      {text2 && (
        <Text style={styles.message} numberOfLines={2}>
          {text2}
        </Text>
      )}
    </View>
  </View>
);

export const toastConfig = {
  success: (props: any) => (
    <ToastBase
      text1={props.text1}
      text2={props.text2}
      iconName="checkmark-circle"
      iconColor={Colors.success}
      backgroundColor="#ECFDF5"
      borderColor={Colors.success}
    />
  ),
  error: (props: any) => (
    <ToastBase
      text1={props.text1}
      text2={props.text2}
      iconName="close-circle"
      iconColor={Colors.error}
      backgroundColor="#FEF2F2"
      borderColor={Colors.error}
    />
  ),
  info: (props: any) => (
    <ToastBase
      text1={props.text1}
      text2={props.text2}
      iconName="information-circle"
      iconColor={Colors.info}
      backgroundColor="#EFF6FF"
      borderColor={Colors.info}
    />
  ),
  warning: (props: any) => (
    <ToastBase
      text1={props.text1}
      text2={props.text2}
      iconName="warning"
      iconColor={Colors.warning}
      backgroundColor="#FFFBEB"
      borderColor={Colors.warning}
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "92%",
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    // Enhanced shadow for visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  message: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
