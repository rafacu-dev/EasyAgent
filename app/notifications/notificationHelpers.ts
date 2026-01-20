/**
 * EasyAgent Notification Helpers
 * Utilities for integrating notifications with EasyAgent functions
 * Replaces old invoice-based notifications
 */

import * as Notifications from "expo-notifications";
import NotificationService from "./NotificationService";
import {
  notifyCallCompleted,
  notifyAppointmentScheduled,
  notifyAgentUpdated,
  notifyPhoneNumberAdded,
  type CallNotificationData,
  type AppointmentNotificationData,
  type AgentNotificationData,
  type PhoneNumberNotificationData,
} from "./easyAgentNotifications";

// Notification service instance
const notificationService = NotificationService.getInstance();

// Helper for creating time interval triggers
const createTimeIntervalTrigger = (
  seconds: number
): Notifications.TimeIntervalTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds,
  repeats: false,
});

// Helper for creating date triggers
const createDateTrigger = (date: Date): Notifications.DateTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date,
});

// ============================================================================
// Call Notifications
// ============================================================================

/**
 * Notify when a call is completed
 */
export const onCallCompleted = async (callData: CallNotificationData) => {
  try {
    // Schedule immediate local notification
    await notificationService.scheduleLocalNotification(
      "Call Completed",
      `Call to ${callData.to_number || "client"} has ended. Duration: ${
        callData.duration || 0
      }s`,
      null, // Immediate
      {
        type: "call_completed",
        call_id: callData.call_id,
        screen: "/call-history",
      }
    );

    // Also notify Django server for push to other devices
    try {
      await notifyCallCompleted(callData);
    } catch (error) {
      console.error("Error notifying server about call completion:", error);
    }

    console.log("Call completion notification scheduled");
  } catch (error) {
    console.error("Error notifying call completion:", error);
  }
};

// ============================================================================
// Appointment Notifications
// ============================================================================

/**
 * Notify when an appointment is scheduled
 */
export const onAppointmentScheduled = async (
  appointmentData: AppointmentNotificationData
) => {
  try {
    await notificationService.scheduleLocalNotification(
      "Appointment Scheduled",
      `New appointment on ${appointmentData.date}${
        appointmentData.client_name
          ? ` with ${appointmentData.client_name}`
          : ""
      }`,
      createTimeIntervalTrigger(1),
      {
        type: "appointment_scheduled",
        appointment_id: appointmentData.id,
        screen: "/(tabs)",
      }
    );

    // Notify server
    try {
      await notifyAppointmentScheduled(appointmentData);
    } catch (error) {
      console.error("Error notifying server about appointment:", error);
    }

    console.log("Appointment notification scheduled");
  } catch (error) {
    console.error("Error notifying appointment:", error);
  }
};

/**
 * Schedule appointment reminder before the appointment
 */
export const scheduleAppointmentReminder = async (
  appointmentData: {
    id: string;
    date: Date;
    client_name?: string;
  },
  minutesBefore: number = 30
) => {
  try {
    const reminderDate = new Date(appointmentData.date);
    reminderDate.setMinutes(reminderDate.getMinutes() - minutesBefore);

    // Don't schedule if the reminder time has passed
    if (reminderDate <= new Date()) {
      console.log("Reminder time has passed, skipping");
      return null;
    }

    const identifier = await notificationService.scheduleLocalNotification(
      "Upcoming Appointment",
      `You have an appointment${
        appointmentData.client_name
          ? ` with ${appointmentData.client_name}`
          : ""
      } in ${minutesBefore} minutes`,
      createDateTrigger(reminderDate),
      {
        type: "appointment_reminder",
        appointment_id: appointmentData.id,
        screen: "/(tabs)",
      }
    );

    console.log(`Appointment reminder scheduled:`, identifier);
    return identifier;
  } catch (error) {
    console.error("Error scheduling appointment reminder:", error);
    return null;
  }
};

// ============================================================================
// Agent Notifications
// ============================================================================

/**
 * Notify when an agent is created or updated
 */
export const onAgentUpdated = async (agentData: AgentNotificationData) => {
  try {
    await notificationService.scheduleLocalNotification(
      "Agent Updated",
      `Your agent "${agentData.name}" has been ${
        agentData.status || "updated"
      }`,
      createTimeIntervalTrigger(1),
      {
        type: "agent_updated",
        agent_id: agentData.id,
        screen: "/agent-setup",
      }
    );

    // Notify server
    try {
      await notifyAgentUpdated(agentData);
    } catch (error) {
      console.error("Error notifying server about agent update:", error);
    }

    console.log("Agent update notification scheduled");
  } catch (error) {
    console.error("Error notifying agent update:", error);
  }
};

/**
 * Notify when a new agent is created
 */
export const onAgentCreated = async (agentData: {
  id: string;
  name: string;
}) => {
  return onAgentUpdated({ ...agentData, status: "created" });
};

// ============================================================================
// Phone Number Notifications
// ============================================================================

/**
 * Notify when a phone number is added
 */
export const onPhoneNumberAdded = async (
  phoneData: PhoneNumberNotificationData
) => {
  try {
    await notificationService.scheduleLocalNotification(
      "Phone Number Added",
      `Your new number ${phoneData.phone_number} is now active`,
      createTimeIntervalTrigger(1),
      {
        type: "phone_number_added",
        phone_number_id: phoneData.id,
        screen: "/(tabs)",
      }
    );

    // Notify server
    try {
      await notifyPhoneNumberAdded(phoneData);
    } catch (error) {
      console.error("Error notifying server about phone number:", error);
    }

    console.log("Phone number notification scheduled");
  } catch (error) {
    console.error("Error notifying phone number addition:", error);
  }
};

// ============================================================================
// General Notification Utilities
// ============================================================================

/**
 * Schedule a custom reminder
 */
export const scheduleCustomReminder = async (
  title: string,
  message: string,
  triggerDate: Date,
  data?: any
) => {
  try {
    const identifier = await notificationService.scheduleLocalNotification(
      title,
      message,
      createDateTrigger(triggerDate),
      data
    );

    console.log("Custom reminder scheduled:", identifier);
    return identifier;
  } catch (error) {
    console.error("Error scheduling custom reminder:", error);
    return null;
  }
};

/**
 * Cancel reminders for a specific entity
 */
export const cancelEntityReminders = async (
  entityType: string,
  entityId: string
) => {
  try {
    const scheduledNotifications =
      await notificationService.getScheduledNotifications();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as any;
      const idKey = `${entityType}_id`;
      if (data?.[idKey] === entityId) {
        await notificationService.cancelScheduledNotification(
          notification.identifier
        );
        console.log(
          `Cancelled notification ${notification.identifier} for ${entityType} ${entityId}`
        );
      }
    }
  } catch (error) {
    console.error(`Error cancelling ${entityType} reminders:`, error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All scheduled notifications cancelled");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledReminders = async () => {
  try {
    return await notificationService.getScheduledNotifications();
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
};

// ============================================================================
// Exports
// ============================================================================

export default {
  // Call notifications
  onCallCompleted,

  // Appointment notifications
  onAppointmentScheduled,
  scheduleAppointmentReminder,

  // Agent notifications
  onAgentUpdated,
  onAgentCreated,

  // Phone number notifications
  onPhoneNumberAdded,

  // General utilities
  scheduleCustomReminder,
  cancelEntityReminders,
  cancelAllReminders,
  getScheduledReminders,
};
