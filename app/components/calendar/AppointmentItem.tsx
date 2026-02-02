/**
 * AppointmentItem Component
 *
 * Individual appointment card with status indicator
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { STATUS_COLORS } from "@/app/hooks/useCalendar";
import type { Appointment, AppointmentStatus } from "@/app/utils/types";

interface AppointmentItemProps {
  appointment: Appointment;
  onPress: (appointment: Appointment) => void;
  formatTime: (time: string) => string;
}

const getStatusIcon = (status: AppointmentStatus) => {
  switch (status) {
    case "confirmed":
      return "checkmark-circle";
    case "cancelled":
      return "close-circle";
    case "completed":
      return "checkmark-done-circle";
    default:
      return "time";
  }
};

export const AppointmentItem = memo(function AppointmentItem({
  appointment,
  onPress,
  formatTime,
}: AppointmentItemProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(appointment)}
    >
      <View
        style={[
          styles.statusBar,
          { backgroundColor: STATUS_COLORS[appointment.status] || Colors.info },
        ]}
      />
      <View style={styles.statusIcon}>
        <Ionicons
          name={getStatusIcon(appointment.status)}
          size={24}
          color={STATUS_COLORS[appointment.status] || Colors.info}
        />
      </View>
      <View style={styles.time}>
        <Text style={styles.timeText}>
          {formatTime(appointment.start_time)}
        </Text>
        {appointment.duration_minutes && (
          <Text style={styles.duration}>
            {appointment.duration_minutes} min
          </Text>
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.title}>{appointment.title}</Text>
        <Text style={styles.client}>{appointment.client_name}</Text>
        {appointment.created_by_agent && (
          <View style={styles.aiTag}>
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
            <Text style={styles.aiTagText}>
              {t("calendar.aiCreated", "AI Created")}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
  },
  statusBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  statusIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  time: {
    width: 70,
    marginRight: 16,
    marginLeft: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.secondary,
  },
  duration: {
    fontSize: 12,
    color: Colors.textLight,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  client: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  aiTagText: {
    fontSize: 11,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default AppointmentItem;
