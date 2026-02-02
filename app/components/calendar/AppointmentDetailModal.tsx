/**
 * AppointmentDetailModal Component
 *
 * Modal displaying appointment details with confirm/cancel actions
 */

import React, { memo } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { STATUS_COLORS } from "@/app/hooks/useCalendar";
import type { Appointment } from "@/app/utils/types";

interface AppointmentDetailModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onCancel: (id: number) => void;
  onConfirm: (id: number) => void;
  formatTime: (time: string) => string;
}

export const AppointmentDetailModal = memo(function AppointmentDetailModal({
  visible,
  appointment,
  onClose,
  onCancel,
  onConfirm,
  formatTime,
}: AppointmentDetailModalProps) {
  const { t } = useTranslation();

  if (!appointment) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{appointment.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body}>
            {/* Date & Time */}
            <View style={styles.detailRow}>
              <Ionicons
                name="calendar"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailText}>
                {new Date(appointment.date).toLocaleDateString()}{" "}
                {t("calendar.at", "at")} {formatTime(appointment.start_time)}
              </Text>
            </View>

            {/* Duration */}
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                {appointment.duration_minutes
                  ? `${appointment.duration_minutes} ${t("calendar.minutes", "minutes")}`
                  : t(
                      "calendar.durationNotSpecified",
                      "Duration not specified",
                    )}
              </Text>
            </View>

            {/* Client Name */}
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{appointment.client_name}</Text>
            </View>

            {/* Client Phone */}
            {appointment.client_phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailText}>
                  {appointment.client_phone}
                </Text>
              </View>
            )}

            {/* Client Email */}
            {appointment.client_email && (
              <View style={styles.detailRow}>
                <Ionicons name="mail" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailText}>
                  {appointment.client_email}
                </Text>
              </View>
            )}

            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_COLORS[appointment.status] },
                ]}
              />
              <Text style={styles.statusText}>
                {appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1)}
              </Text>
            </View>

            {/* Description */}
            {appointment.description && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {t("calendar.description", "Description")}
                </Text>
                <Text style={styles.sectionText}>
                  {appointment.description}
                </Text>
              </View>
            )}

            {/* Notes */}
            {appointment.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {t("calendar.notes", "Notes")}
                </Text>
                <Text style={styles.sectionText}>{appointment.notes}</Text>
              </View>
            )}

            {/* AI Created Badge */}
            {appointment.created_by_agent && (
              <View style={styles.aiCreatedBadge}>
                <Ionicons name="sparkles" size={16} color={Colors.primary} />
                <Text style={styles.aiCreatedText}>
                  {t(
                    "calendar.createdByAgent",
                    "Created by AI Agent during a call",
                  )}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {appointment.status === "scheduled" ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => onCancel(appointment.id)}
                >
                  <Text style={styles.cancelButtonText}>
                    {t("calendar.cancelAppointment", "Cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => onConfirm(appointment.id)}
                >
                  <Text style={styles.confirmButtonText}>
                    {t("calendar.confirmAppointment", "Confirm")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>
                  {t("common.close", "Close")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  body: {
    padding: 20,
    maxHeight: 400,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
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
  section: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  sectionText: {
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
});

export default AppointmentDetailModal;
