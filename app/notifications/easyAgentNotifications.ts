/**
 * EasyAgent Notification Integration
 * Replaces old invoice-based notifications with EasyAgent-specific notifications
 * for phone numbers, agents, appointments, and calls.
 */

import { apiClient } from "@/utils/axios-interceptor";

// ============================================================================
// Types
// ============================================================================

export interface NotificationPreference {
  notification_type: string;
  is_enabled: boolean;
}

export interface NotificationLog {
  id: number;
  title: string;
  body: string;
  notification_type: string;
  status: string;
  sent_at: string;
  data?: Record<string, any>;
}

export interface CallNotificationData {
  call_id: string;
  to_number?: string;
  duration?: number;
  status?: string;
}

export interface AppointmentNotificationData {
  id: string;
  date: string;
  time?: string;
  client_name?: string;
}

export interface AgentNotificationData {
  id: string;
  name: string;
  status?: string;
}

export interface PhoneNumberNotificationData {
  id: string;
  phone_number: string;
  friendly_name?: string;
}

// ============================================================================
// Notification Types for EasyAgent
// ============================================================================

export const NOTIFICATION_TYPES = {
  CALL_RECEIVED: "call_received",
  CALL_COMPLETED: "call_completed",
  APPOINTMENT_SCHEDULED: "appointment_scheduled",
  APPOINTMENT_REMINDER: "appointment_reminder",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// ============================================================================
// Send Notification Triggers to Backend
// ============================================================================

/**
 * Notify when an appointment is scheduled
 */
export const notifyAppointmentScheduled = async (
  appointmentData: AppointmentNotificationData,
): Promise<boolean> => {
  try {
    const response = await apiClient.post(
      "notifications/appointment/scheduled/",
      {
        appointment_id: appointmentData.id,
        date: appointmentData.date,
        time: appointmentData.time,
        client_name: appointmentData.client_name,
      },
    );

    console.log("✅ Appointment notification sent:", response.data);
    return response.data?.success ?? true;
  } catch (error: any) {
    console.error(
      "❌ Failed to send appointment notification:",
      error.response?.data || error.message,
    );
    return false;
  }
};

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Get notification preferences from server
 */
export const getNotificationPreferences = async (): Promise<
  NotificationPreference[] | null
> => {
  try {
    const response = await apiClient.get("notifications/preferences/");
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Failed to get preferences:",
      error.response?.data || error.message,
    );
    return null;
  }
};

/**
 * Update notification preferences on server
 */
export const updateNotificationPreferences = async (
  preferences: Record<string, boolean>,
): Promise<boolean> => {
  try {
    // Convert to array format expected by backend
    const preferencesArray = Object.entries(preferences).map(
      ([type, enabled]) => ({
        notification_type: type,
        is_enabled: enabled,
      }),
    );

    const response = await apiClient.post("notifications/preferences/", {
      preferences: preferencesArray,
    });

    console.log("✅ Preferences updated:", response.data);
    return true;
  } catch (error: any) {
    console.error(
      "❌ Failed to update preferences:",
      error.response?.data || error.message,
    );
    return false;
  }
};

/**
 * Get default preferences for EasyAgent
 */
export const getDefaultPreferences = (): Record<string, boolean> => ({
  [NOTIFICATION_TYPES.CALL_RECEIVED]: true,
  [NOTIFICATION_TYPES.CALL_COMPLETED]: true,
  [NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED]: true,
  [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: true,
});

// ============================================================================
// Notification History
// ============================================================================

/**
 * Get notification logs from server
 */
export const getNotificationLogs = async (): Promise<
  NotificationLog[] | null
> => {
  try {
    const response = await apiClient.get("notifications/logs/");
    return response.data?.results || response.data || [];
  } catch (error: any) {
    console.error(
      "❌ Failed to get notification logs:",
      error.response?.data || error.message,
    );
    return null;
  }
};

// ============================================================================
// Test Notification
// ============================================================================

/**
 * Send a test notification to verify setup
 */
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    const response = await apiClient.post("notifications/test/");
    console.log("✅ Test notification sent:", response.data);
    return response.data?.success ?? true;
  } catch (error: any) {
    console.error(
      "❌ Failed to send test notification:",
      error.response?.data || error.message,
    );
    return false;
  }
};

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Get the screen to navigate to based on notification type
 */
export const getScreenForNotificationType = (
  type: NotificationType | string,
): string => {
  switch (type) {
    case NOTIFICATION_TYPES.CALL_RECEIVED:
      return "/call-history";
    case NOTIFICATION_TYPES.CALL_COMPLETED:
      return "/call-history";
    case NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED:
      return "/(tabs)"; // Main screen or appointments when available
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
      return "/(tabs)"; // Main screen or appointments when available
    default:
      return "/(tabs)";
  }
};

/**
 * Get human-readable label for notification type
 */
export const getNotificationTypeLabel = (
  type: NotificationType | string,
): string => {
  switch (type) {
    case NOTIFICATION_TYPES.CALL_RECEIVED:
      return "Incoming Call Notifications";
    case NOTIFICATION_TYPES.CALL_COMPLETED:
      return "Call Completed Notifications";
    case NOTIFICATION_TYPES.APPOINTMENT_SCHEDULED:
      return "Appointment Notifications";
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
      return "Appointment Reminders";
    default:
      return type;
  }
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Send notifications
  notifyAppointmentScheduled,

  // Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  getDefaultPreferences,

  // Logs
  getNotificationLogs,

  // Test
  sendTestNotification,

  // Helpers
  getScreenForNotificationType,
  getNotificationTypeLabel,

  // Constants
  NOTIFICATION_TYPES,
};
