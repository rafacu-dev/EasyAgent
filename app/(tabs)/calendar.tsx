import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Colors } from "../../utils/colors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useAgentQuery, useAgentPhoneNumber } from "../../utils/hooks";
import NoPhoneNumber from "../../components/NoPhoneNumber";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../utils/axios-interceptor";
import type {
  Appointment,
  MonthResponse,
  AppointmentStatus,
} from "../../utils/types";
import {
  onAppointmentScheduled,
  scheduleAppointmentReminder,
} from "../notifications/notificationHelpers";
import type { AppointmentNotificationData } from "../notifications/easyAgentNotifications";

const STATUS_COLORS: { [key in AppointmentStatus]: string } = {
  scheduled: Colors.info,
  confirmed: Colors.success,
  completed: Colors.textSecondary,
  cancelled: Colors.error,
  no_show: Colors.warning,
  rescheduled: "#9b59b6",
};

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { data: agentConfig } = useAgentQuery();
  const { phoneNumber } = useAgentPhoneNumber(agentConfig?.id);
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for new appointment
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    duration_minutes: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    notes: "",
  });

  // Fetch appointments for the month
  const { data: monthData, isLoading } = useQuery<MonthResponse>({
    queryKey: [
      "appointments-month",
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
    ],
    queryFn: async () => {
      const response = await apiClient.get(
        `appointments/month/?year=${selectedDate.getFullYear()}&month=${
          selectedDate.getMonth() + 1
        }`
      );
      console.log("Fetched month data:", response);
      return response;
    },
    enabled: !!phoneNumber,
  });

  const appointments: Appointment[] = monthData?.data ?? [];
  const appointmentDates: string[] = monthData?.appointment_dates ?? [];

  // Get appointments for selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const dayAppointments = appointments.filter(
    (apt) => apt.date === selectedDateStr
  );

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("appointments/", data),
    onSuccess: (response) => {
      // Refetch the current month's data immediately
      queryClient.invalidateQueries({ queryKey: ["appointments-month"] });
      queryClient.refetchQueries({
        queryKey: [
          "appointments-month",
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
        ],
      });
      setShowAddModal(false);
      resetForm();

      // Send notifications for new appointment
      const appointmentData = response?.data || response;
      if (appointmentData) {
        const notificationPayload: AppointmentNotificationData = {
          id: String(appointmentData.id),
          date: appointmentData.date || formData.date,
          time: appointmentData.start_time || formData.start_time,
          client_name: appointmentData.client_name || formData.client_name,
        };
        onAppointmentScheduled(notificationPayload).catch((err) =>
          console.error("Failed to send appointment notification:", err)
        );

        // Schedule reminder notification if appointment has a valid date/time
        if (appointmentData.date && appointmentData.start_time) {
          scheduleAppointmentReminder({
            id: String(appointmentData.id),
            date: new Date(
              appointmentData.date + "T" + appointmentData.start_time
            ),
            client_name: appointmentData.client_name || formData.client_name,
          }).catch((err) =>
            console.error("Failed to schedule appointment reminder:", err)
          );
        }
      }

      Alert.alert(
        t("calendar.success", "Success"),
        t("calendar.appointmentCreated", "Appointment created successfully")
      );
    },
    onError: (error: any) => {
      Alert.alert(
        t("common.error", "Error"),
        error.response?.data?.error || "Failed to create appointment"
      );
    },
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`appointments/${id}/cancel/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-month"] });
      setShowDetailModal(false);
    },
    onError: (error: any) => {
      Alert.alert(
        t("common.error", "Error"),
        error.response?.data?.error ||
          t("calendar.cancelFailed", "Failed to cancel appointment")
      );
    },
  });

  // Confirm appointment mutation
  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`appointments/${id}/confirm/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-month"] });
      setShowDetailModal(false);
    },
    onError: (error: any) => {
      Alert.alert(
        t("common.error", "Error"),
        error.response?.data?.error ||
          t("calendar.confirmFailed", "Failed to confirm appointment")
      );
    },
  });

  const resetForm = () => {
    const currentDateStr = selectedDate.toISOString().split("T")[0];
    setFormData({
      title: "",
      description: "",
      date: currentDateStr,
      start_time: "",
      duration_minutes: "",
      client_name: "",
      client_phone: "",
      client_email: "",
      notes: "",
    });
  };

  const handleCreateAppointment = () => {
    if (
      !formData.title ||
      !formData.date ||
      !formData.start_time ||
      !formData.client_name
    ) {
      Alert.alert(
        t("common.error", "Error"),
        t("calendar.fillRequired", "Please fill all required fields")
      );
      return;
    }

    const payload: any = {
      ...formData,
      agent: agentConfig?.id,
    };

    // Only include duration_minutes if it has a value
    if (formData.duration_minutes && formData.duration_minutes.trim() !== "") {
      payload.duration_minutes = parseInt(formData.duration_minutes, 10);
    } else {
      payload.duration_minutes = null;
    }

    createMutation.mutate(payload);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient
      .invalidateQueries({ queryKey: ["appointments-month"] })
      .finally(() => setRefreshing(false));
  }, [queryClient]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

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

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentDay = selectedDate.getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const hasAppointments = appointmentDates.includes(dateStr);

      const isToday =
        day === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();

      const isSelected = day === currentDay;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected,
          ]}
          onPress={() =>
            setSelectedDate(
              new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
            )
          }
        >
          <Text
            style={[
              styles.calendarDayText,
              (isToday || isSelected) && styles.calendarDayTextHighlight,
            ]}
          >
            {day}
          </Text>
          {hasAppointments && <View style={styles.appointmentDot} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: number) => {
    setSelectedDate(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + direction,
        1
      )
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("calendar.title", "Calendar")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("calendar.subtitle", "View and manage appointments")}
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.monthButton}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={Colors.secondary}
              />
            </TouchableOpacity>

            <Text style={styles.monthText}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>

            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.monthButton}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysContainer}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
        </View>

        <View style={styles.appointmentsContainer}>
          <Text style={styles.sectionTitle}>
            {t("calendar.appointments", "Appointments")} -{" "}
            {selectedDate.toLocaleDateString()}
          </Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : dayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={Colors.textLight}
              />
              <Text style={styles.emptyStateText}>
                {t("calendar.noAppointments", "No appointments")}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {t(
                  "calendar.appointmentsWillAppear",
                  "Scheduled appointments will appear here"
                )}
              </Text>
            </View>
          ) : (
            dayAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentItem}
                onPress={() => {
                  setSelectedAppointment(appointment);
                  setShowDetailModal(true);
                }}
              >
                <View
                  style={[
                    styles.statusBar,
                    {
                      backgroundColor:
                        STATUS_COLORS[appointment.status] || Colors.info,
                    },
                  ]}
                />
                <View style={styles.statusIcon}>
                  <Ionicons
                    name={
                      appointment.status === "confirmed"
                        ? "checkmark-circle"
                        : appointment.status === "cancelled"
                        ? "close-circle"
                        : appointment.status === "completed"
                        ? "checkmark-done-circle"
                        : "time"
                    }
                    size={24}
                    color={STATUS_COLORS[appointment.status] || Colors.info}
                  />
                </View>
                <View style={styles.appointmentTime}>
                  <Text style={styles.appointmentTimeText}>
                    {formatTime(appointment.start_time)}
                  </Text>
                  {appointment.duration_minutes && (
                    <Text style={styles.appointmentDuration}>
                      {appointment.duration_minutes} min
                    </Text>
                  )}
                </View>
                <View style={styles.appointmentDetails}>
                  <Text style={styles.appointmentTitle}>
                    {appointment.title}
                  </Text>
                  <Text style={styles.appointmentClient}>
                    {appointment.client_name}
                  </Text>
                  {appointment.created_by_agent && (
                    <View style={styles.aiTag}>
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={Colors.primary}
                      />
                      <Text style={styles.aiTagText}>
                        {t("calendar.aiCreated", "AI Created")}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>
              {t("calendar.addAppointment", "Add Appointment")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("calendar.newAppointment", "New Appointment")}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {t("calendar.appointmentTitle", "Title")} *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, title: text }))
                }
                placeholder={t(
                  "calendar.titlePlaceholder",
                  "Appointment title"
                )}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.date", "Date")} *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, date: text }))
                }
                placeholder={t("calendar.datePlaceholder", "YYYY-MM-DD")}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.time", "Time")} *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.start_time}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, start_time: text }))
                }
                placeholder={t(
                  "calendar.timePlaceholder",
                  "HH:MM (e.g., 14:30)"
                )}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.duration", "Duration (minutes)")}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.duration_minutes}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, duration_minutes: text }))
                }
                placeholder={t("calendar.durationPlaceholder", "30")}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.clientName", "Client Name")} *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.client_name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, client_name: text }))
                }
                placeholder={t(
                  "calendar.clientNamePlaceholder",
                  "Client's name"
                )}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.clientPhone", "Client Phone")}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.client_phone}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, client_phone: text }))
                }
                placeholder={t(
                  "calendar.clientPhonePlaceholder",
                  "+1234567890"
                )}
                keyboardType="phone-pad"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.clientEmail", "Client Email")}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.client_email}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, client_email: text }))
                }
                placeholder={t(
                  "calendar.clientEmailPlaceholder",
                  "email@example.com"
                )}
                keyboardType="email-address"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.description", "Description")}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
                placeholder={t(
                  "calendar.descriptionPlaceholder",
                  "Appointment details..."
                )}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.inputLabel}>
                {t("calendar.notes", "Notes")}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, notes: text }))
                }
                placeholder={t(
                  "calendar.notesPlaceholder",
                  "Additional notes..."
                )}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel", "Cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCreateAppointment}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {t("common.save", "Save")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedAppointment?.title}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {new Date(selectedAppointment.date).toLocaleDateString()}{" "}
                    {t("calendar.at", "at")}{" "}
                    {formatTime(selectedAppointment.start_time)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="time"
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {selectedAppointment.duration_minutes
                      ? `${selectedAppointment.duration_minutes} ${t(
                          "calendar.minutes",
                          "minutes"
                        )}`
                      : t(
                          "calendar.durationNotSpecified",
                          "Duration not specified"
                        )}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {selectedAppointment.client_name}
                  </Text>
                </View>

                {selectedAppointment.client_phone && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="call"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      {selectedAppointment.client_phone}
                    </Text>
                  </View>
                )}

                {selectedAppointment.client_email && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="mail"
                      size={20}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      {selectedAppointment.client_email}
                    </Text>
                  </View>
                )}

                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          STATUS_COLORS[selectedAppointment.status],
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {selectedAppointment.status.charAt(0).toUpperCase() +
                      selectedAppointment.status.slice(1)}
                  </Text>
                </View>

                {selectedAppointment.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionLabel}>
                      {t("calendar.description", "Description")}
                    </Text>
                    <Text style={styles.descriptionText}>
                      {selectedAppointment.description}
                    </Text>
                  </View>
                )}

                {selectedAppointment.notes && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionLabel}>
                      {t("calendar.notes", "Notes")}
                    </Text>
                    <Text style={styles.descriptionText}>
                      {selectedAppointment.notes}
                    </Text>
                  </View>
                )}

                {selectedAppointment.created_by_agent && (
                  <View style={styles.aiCreatedBadge}>
                    <Ionicons
                      name="sparkles"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.aiCreatedText}>
                      {t(
                        "calendar.createdByAgent",
                        "Created by AI Agent during a call"
                      )}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              {selectedAppointment?.status === "scheduled" && (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() =>
                      cancelMutation.mutate(selectedAppointment.id)
                    }
                  >
                    <Text style={styles.cancelButtonText}>
                      {t("calendar.cancelAppointment", "Cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() =>
                      confirmMutation.mutate(selectedAppointment.id)
                    }
                  >
                    <Text style={styles.confirmButtonText}>
                      {t("calendar.confirmAppointment", "Confirm")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {selectedAppointment?.status !== "scheduled" && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.closeButtonText}>
                    {t("common.close", "Close")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  calendarContainer: {
    margin: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  weekDay: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  calendarDayToday: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  calendarDayTextHighlight: {
    color: Colors.textWhite,
    fontWeight: "600",
  },
  appointmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  appointmentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyState: {
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
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  appointmentItem: {
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
  appointmentTime: {
    width: 70,
    marginRight: 16,
    marginLeft: 8,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.secondary,
  },
  appointmentDuration: {
    fontSize: 12,
    color: Colors.textLight,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  appointmentClient: {
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
  quickActionsContainer: {
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundLight,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Detail modal styles
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  descriptionSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  aiCreatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    gap: 8,
  },
  aiCreatedText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
});
