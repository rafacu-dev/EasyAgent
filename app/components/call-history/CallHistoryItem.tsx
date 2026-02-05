import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/app/utils/colors";
import { getCallStatusConfig } from "@/app/utils/callStatusHelpers";
import type { RecentCallItem } from "@/app/utils/types";

interface CallHistoryItemProps {
  item: RecentCallItem;
}

export function CallHistoryItem({ item }: CallHistoryItemProps) {
  const handlePress = () => {
    router.push({ pathname: "/call-details/[id]", params: { id: item.id } });
  };

  const statusConfig = getCallStatusConfig(item.status);

  return (
    <TouchableOpacity style={styles.callItem} onPress={handlePress}>
      <View style={styles.callInfo}>
        <View style={styles.callNumberRow}>
          <Ionicons
            name={item.direction === "inbound" ? "arrow-down" : "arrow-up"}
            size={14}
            color={item.direction === "inbound" ? Colors.success : Colors.info}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.callDirectionLabel}>
            {item.direction === "inbound" ? "From" : "To"}:
          </Text>
          {item.direction === "inbound" && item.fromContactName ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.callContactName} selectable>
                {item.fromContactName}
              </Text>
            </View>
          ) : item.direction === "outbound" && item.toContactName ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.callContactName} selectable>
                {item.toContactName}
              </Text>
            </View>
          ) : (
            <Text style={styles.callNumber} selectable>
              {item.number}
            </Text>
          )}
        </View>
        <View style={styles.callMetaRow}>
          <Text style={styles.callDate} selectable>
            {item.date}
          </Text>
          {item.callSource && item.callSource !== "unknown" && (
            <View style={styles.callTypeBadge}>
              <Text style={styles.callTypeText}>
                {item.callSource === "retell" ? "Agent" : "Phone"}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.callRightSection}>
        <View style={styles.durationStatusRow}>
          <Text style={styles.callDuration} selectable>
            {item.duration}
          </Text>
          <View
            style={[
              styles.callStatusIcon,
              { backgroundColor: statusConfig.color + "15" },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.textLight}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  callInfo: {
    flex: 1,
  },
  callNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  callDirectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginRight: 4,
  },
  callNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  callContactName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  callMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  callTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.primary + "20",
    borderRadius: 4,
  },
  callTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "capitalize",
  },
  callRightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  callStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
