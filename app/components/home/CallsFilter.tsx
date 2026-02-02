/**
 * CallsFilter Component
 *
 * Filter buttons for call type (all, inbound, outbound)
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import type { CallTypeFilter } from "@/app/hooks/useHome";

interface CallsFilterProps {
  filter: CallTypeFilter;
  onFilterChange: (filter: CallTypeFilter) => void;
}

export const CallsFilter = memo(function CallsFilter({
  filter,
  onFilterChange,
}: CallsFilterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* All */}
      <TouchableOpacity
        style={[styles.button, filter === "all" && styles.buttonActiveAll]}
        onPress={() => onFilterChange("all")}
      >
        <Ionicons
          name="swap-vertical"
          size={14}
          color={filter === "all" ? Colors.primary : Colors.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.buttonText,
            filter === "all" && styles.buttonTextActiveAll,
          ]}
        >
          {t("home.filterAll", "All")}
        </Text>
      </TouchableOpacity>

      {/* Inbound */}
      <TouchableOpacity
        style={[
          styles.button,
          filter === "inbound" && styles.buttonActiveInbound,
        ]}
        onPress={() => onFilterChange("inbound")}
      >
        <SimpleLineIcons
          name="call-in"
          size={14}
          color={filter === "inbound" ? "#10B981" : Colors.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.buttonText,
            filter === "inbound" && styles.buttonTextActiveInbound,
          ]}
        >
          {t("home.filterInbound", "Inbound")}
        </Text>
      </TouchableOpacity>

      {/* Outbound */}
      <TouchableOpacity
        style={[
          styles.button,
          filter === "outbound" && styles.buttonActiveOutbound,
        ]}
        onPress={() => onFilterChange("outbound")}
      >
        <SimpleLineIcons
          name="call-out"
          size={14}
          color={filter === "outbound" ? "#3B82F6" : Colors.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.buttonText,
            filter === "outbound" && styles.buttonTextActiveOutbound,
          ]}
        >
          {t("home.filterOutbound", "Outbound")}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  icon: {
    marginRight: 6,
  },
  buttonActiveAll: {
    backgroundColor: Colors.primaryTransparent,
  },
  buttonActiveInbound: {
    backgroundColor: "#10B98120",
  },
  buttonActiveOutbound: {
    backgroundColor: "#3B82F620",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  buttonTextActiveAll: {
    color: Colors.primary,
  },
  buttonTextActiveInbound: {
    color: "#10B981",
  },
  buttonTextActiveOutbound: {
    color: "#3B82F6",
  },
});

export default CallsFilter;
