/**
 * Calendar Screen
 *
 * Monthly calendar view with appointments management
 * Uses useCalendar hook for state management and calendar components for UI
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import { useCalendar } from "@/app/hooks/useCalendar";
import NoPhoneNumber from "@/app/components/NoPhoneNumber";
import {
  CalendarGrid,
  AppointmentList,
  AppointmentDetailModal,
} from "@/app/components/calendar";

export default function CalendarScreen() {
  const { t } = useTranslation();

  const {
    // Loading states
    isLoading,

    // Data
    phoneNumber,
    appointmentDates,
    dayAppointments,

    // Date selection
    selectedDate,
    setSelectedDate,
    changeMonth,

    // Detail modal
    showDetailModal,
    selectedAppointment,
    openAppointmentDetail,
    closeDetailModal,

    // Actions
    cancelAppointment,
    confirmAppointment,

    // Refresh
    refreshing,
    onRefresh,

    // Navigation
    goToCreateAppointment,

    // Helpers
    formatTime,
  } = useCalendar();

  // No phone number view
  if (!phoneNumber) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t("calendar.title", "Calendar")}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t("calendar.subtitle", "View and manage appointments")}
            </Text>
          </View>
          <NoPhoneNumber variant="detailed" translationPrefix="calendar" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("calendar.title", "Calendar")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("calendar.subtitle", "View and manage appointments")}
          </Text>
        </View>

        {/* Calendar Grid */}
        <CalendarGrid
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={changeMonth}
          appointmentDates={appointmentDates}
        />

        {/* Appointments List */}
        <AppointmentList
          appointments={dayAppointments}
          selectedDate={selectedDate}
          isLoading={isLoading}
          onAppointmentPress={openAppointmentDetail}
          formatTime={formatTime}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={goToCreateAppointment}
          >
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>
              {t("calendar.addAppointment", "Add Appointment")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        visible={showDetailModal}
        appointment={selectedAppointment}
        onClose={closeDetailModal}
        onCancel={cancelAppointment}
        onConfirm={confirmAppointment}
        formatTime={formatTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  quickActions: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
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
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 16,
  },
});
