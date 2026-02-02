/**
 * AppointmentList Component
 *
 * List of appointments for a selected date
 */

import React, { memo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { AppointmentItem } from "./AppointmentItem";
import type { Appointment } from "@/app/utils/types";

interface AppointmentListProps {
  appointments: Appointment[];
  selectedDate: Date;
  isLoading: boolean;
  onAppointmentPress: (appointment: Appointment) => void;
  formatTime: (time: string) => string;
}

export const AppointmentList = memo(function AppointmentList({
  appointments,
  selectedDate,
  isLoading,
  onAppointmentPress,
  formatTime,
}: AppointmentListProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t("calendar.appointments", "Appointments")} -{" "}
        {selectedDate.toLocaleDateString()}
      </Text>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="calendar-outline"
            size={64}
            color={Colors.textLight}
          />
          <Text style={styles.emptyText}>
            {t("calendar.noAppointments", "No appointments")}
          </Text>
          <Text style={styles.emptySubtext}>
            {t(
              "calendar.appointmentsWillAppear",
              "Scheduled appointments will appear here",
            )}
          </Text>
        </View>
      ) : (
        appointments.map((appointment) => (
          <AppointmentItem
            key={appointment.id}
            appointment={appointment}
            onPress={onAppointmentPress}
            formatTime={formatTime}
          />
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  loading: {
    padding: 40,
    alignItems: "center",
  },
  empty: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});

export default AppointmentList;
