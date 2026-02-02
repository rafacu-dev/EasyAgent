/**
 * CallItem Component
 *
 * Individual call item for the call history list
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Colors } from "@/app/utils/colors";
import type { RecentCallItem } from "@/app/utils/types";

interface CallItemProps {
  item: RecentCallItem;
}

export const CallItem = memo(function CallItem({ item }: CallItemProps) {
  const handlePress = () => {
    router.push({ pathname: "/call-details/[id]", params: { id: item.id } });
  };

  const displayName =
    item.direction === "inbound"
      ? item.fromContactName || item.number
      : item.toContactName || item.number;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[Colors.primary, "#ffc09cff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={20} color="#fff" />
        </LinearGradient>
        <View
          style={[
            styles.directionBadge,
            {
              backgroundColor:
                item.direction === "inbound" ? "#10B981" : "#3B82F6",
            },
          ]}
        >
          <Ionicons
            name={item.direction === "inbound" ? "arrow-down" : "arrow-up"}
            size={10}
            color="#fff"
          />
        </View>
      </View>
      <View style={styles.info}>
        <View style={styles.numberRow}>
          <Text style={styles.number}>{displayName}</Text>
        </View>
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 20,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  directionBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  info: {
    flex: 1,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  number: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  duration: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
});

export default CallItem;
