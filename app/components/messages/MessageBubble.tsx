/**
 * MessageBubble Component
 *
 * Individual message bubble with status indicators
 */

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import type { Message } from "@/app/utils/types";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  const getStatusIcon = () => {
    switch (message.status) {
      case "delivered":
        return "checkmark-done";
      case "sent":
        return "checkmark";
      case "failed":
        return "close";
      default:
        return "time-outline";
    }
  };

  return (
    <View
      style={[styles.bubble, isOutbound ? styles.outbound : styles.inbound]}
    >
      <Text
        style={[
          styles.text,
          isOutbound ? styles.outboundText : styles.inboundText,
        ]}
      >
        {message.body}
      </Text>
      <View style={styles.footer}>
        <Text
          style={[
            styles.time,
            isOutbound ? styles.outboundTime : styles.inboundTime,
          ]}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {isOutbound && (
          <Ionicons
            name={getStatusIcon()}
            size={14}
            color={
              message.status === "failed" ? Colors.error : Colors.textWhite
            }
            style={styles.statusIcon}
          />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  outbound: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  inbound: {
    backgroundColor: Colors.cardBackground,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  outboundText: {
    color: Colors.textWhite,
  },
  inboundText: {
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  time: {
    fontSize: 11,
  },
  outboundTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  inboundTime: {
    color: Colors.textLight,
  },
  statusIcon: {
    marginLeft: 4,
  },
});

export default MessageBubble;
