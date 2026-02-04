import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "@/app/utils/colors";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAgentQuery } from "@/app/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { showError, showSuccess } from "@/app/utils/toast";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  onAppointmentScheduled,
  scheduleAppointmentReminder,
} from "./notifications/notificationHelpers";
import type { AppointmentNotificationData } from "./notifications/easyAgentNotifications";

export default function CreateAppointmentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: agentConfig } = useAgentQuery();
  const params = useLocalSearchParams();

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

  // Date and time picker visibility states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  // Set the date from params only once when component mounts
  useEffect(() => {
    const dateParam = params.date as string;
    if (dateParam) {
      setFormData((prev) => ({ ...prev, date: dateParam }));
      // Parse the date parameter and set it to the date picker
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }
  }, []);

  // Handle date change
  const onDateChange = (event: any, date?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      setFormData((prev) => ({ ...prev, date: formattedDate }));
      // Hide picker after selection on Android, keep open on iOS until dismissed
      if (Platform.OS === "android") {
        setShowDatePicker(false);
      }
    }
  };

  // Handle time change
  const onTimeChange = (event: any, time?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }
    if (time) {
      setSelectedTime(time);
      // Format time as HH:MM
      const hours = String(time.getHours()).padStart(2, "0");
      const minutes = String(time.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      setFormData((prev) => ({ ...prev, start_time: formattedTime }));
      // Hide picker after selection on Android, keep open on iOS until dismissed
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
    }
  };

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("appointments/", data),
    onSuccess: (response) => {
      // Refetch appointments data
      queryClient.invalidateQueries({ queryKey: ["appointments-month"] });

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
          console.error("Failed to send appointment notification:", err),
        );

        // Schedule reminder notification if appointment has a valid date/time
        if (appointmentData.date && appointmentData.start_time) {
          scheduleAppointmentReminder({
            id: String(appointmentData.id),
            date: new Date(
              appointmentData.date + "T" + appointmentData.start_time,
            ),
            client_name: appointmentData.client_name || formData.client_name,
          }).catch((err) =>
            console.error("Failed to schedule appointment reminder:", err),
          );
        }
      }

      showSuccess(
        t("calendar.success", "Success"),
        t("calendar.appointmentCreated", "Appointment created successfully"),
      );

      router.back();
    },
    onError: (error: any) => {
      showError(
        t("common.error", "Error"),
        error.response?.data?.error || "Failed to create appointment",
      );
    },
  });

  const handleCreateAppointment = () => {
    if (
      !formData.title ||
      !formData.date ||
      !formData.start_time ||
      !formData.client_name
    ) {
      showError(
        t("common.error", "Error"),
        t("calendar.fillRequired", "Please fill all required fields"),
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          presentation: "modal",
          title: t("calendar.newAppointment", "New Appointment"),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 30}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>
              {t("calendar.appointmentTitle", "Title")} *
            </Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, title: text }))
              }
              placeholder={t("calendar.titlePlaceholder", "Appointment title")}
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.inputLabel}>
              {t("calendar.date", "Date")} *
            </Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={
                  formData.date ? styles.inputText : styles.placeholderText
                }
              >
                {formData.date || t("calendar.datePlaceholder", "YYYY-MM-DD")}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <Text style={styles.inputLabel}>
              {t("calendar.time", "Time")} *
            </Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text
                style={
                  formData.start_time
                    ? styles.inputText
                    : styles.placeholderText
                }
              >
                {formData.start_time ||
                  t("calendar.timePlaceholder", "HH:MM (e.g., 14:30)")}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
                is24Hour={true}
              />
            )}

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
              placeholder={t("calendar.clientNamePlaceholder", "Client's name")}
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
              placeholder={t("calendar.clientPhonePlaceholder", "+1234567890")}
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
                "email@example.com",
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
                "Appointment details...",
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
                "Additional notes...",
              )}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
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
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.cardBackground,
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
  inputText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
});
