import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "./useNotifications";
import { useTranslation } from "react-i18next";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
} from "./easyAgentNotifications";

interface NotificationPreferences {
  enabled: boolean;
  call_received: boolean;
  call_completed: boolean;
  appointment_scheduled: boolean;
  appointment_reminder: boolean;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  call_received: true,
  call_completed: true,
  appointment_scheduled: true,
  appointment_reminder: true,
};

const NotificationPreferencesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    try {
      // First load from local storage
      const savedPreferences = await AsyncStorage.getItem(
        "notification_preferences",
      );
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      }

      // Then try to sync from server
      const serverPrefs = await getNotificationPreferences();
      if (serverPrefs && serverPrefs.length > 0) {
        const prefsMap: Record<string, boolean> = {};
        serverPrefs.forEach((pref) => {
          prefsMap[pref.notification_type] = pref.is_enabled;
        });
        const merged = { ...defaultPreferences, ...prefsMap };
        setPreferences(merged);
        await AsyncStorage.setItem(
          "notification_preferences",
          JSON.stringify(merged),
        );
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (
    newPreferences: NotificationPreferences,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        "notification_preferences",
        JSON.stringify(newPreferences),
      );
      setPreferences(newPreferences);

      // Sync with server
      await syncPreferencesWithServer(newPreferences);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      Alert.alert(t("common.error"), t("notifications.preferencesError"));
    }
  };

  const syncPreferencesWithServer = async (
    prefs: NotificationPreferences,
  ): Promise<void> => {
    try {
      if (!expoPushToken) {
        console.warn("No push token available for syncing preferences");
        return;
      }

      setIsSyncing(true);

      // Filter out the 'enabled' key and send EasyAgent notification types
      const { enabled, ...notificationPrefs } = prefs;
      await updateNotificationPreferences(notificationPrefs);

      console.log("✅ Preferences synced with server");
    } catch (error) {
      console.error("Error syncing preferences with server:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences): void => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const testNotification = async (): Promise<void> => {
    try {
      if (!expoPushToken) {
        Alert.alert(t("common.error"), "No push token available");
        return;
      }

      Alert.alert(
        t("notifications.testNotification", "Test Notification"),
        t(
          "notifications.testNotificationMessage",
          "A test notification will be sent to your device.",
        ),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.submit"),
            onPress: async () => {
              setIsSyncing(true);
              const success = await sendTestNotification();
              setIsSyncing(false);

              if (success) {
                Alert.alert(
                  t("common.success"),
                  t(
                    "notifications.testNotificationSent",
                    "Test notification sent!",
                  ),
                );
              } else {
                Alert.alert(
                  t("common.error"),
                  t(
                    "notifications.testNotificationFailed",
                    "Failed to send test notification",
                  ),
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t("notifications.loadingPreferences")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("notifications.preferences")}</Text>
        <Text style={styles.subtitle}>
          {t("notifications.customizeNotifications")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("notifications.pushNotifications")}
        </Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>
              {t("notifications.enableNotifications", "Enable Notifications")}
            </Text>
            <Text style={styles.preferenceDescription}>
              {t(
                "notifications.enableDescription",
                "Allow app to send push notifications",
              )}
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={() => togglePreference("enabled")}
            trackColor={{ false: "#767577", true: "#8d36ff" }}
            thumbColor={preferences.enabled ? "#ffffff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>
              {t("notifications.incomingCalls", "Incoming Calls")}
            </Text>
            <Text style={styles.preferenceDescription}>
              {t(
                "notifications.incomingCallsDescription",
                "Notifications when calls are received by your agent",
              )}
            </Text>
          </View>
          <Switch
            value={preferences.call_received}
            onValueChange={() => togglePreference("call_received")}
            trackColor={{ false: "#767577", true: "#8d36ff" }}
            thumbColor={preferences.call_received ? "#ffffff" : "#f4f3f4"}
            disabled={!preferences.enabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>
              {t("notifications.callsCompleted", "Calls Completed")}
            </Text>
            <Text style={styles.preferenceDescription}>
              {t(
                "notifications.callsCompletedDescription",
                "Notifications when calls are completed",
              )}
            </Text>
          </View>
          <Switch
            value={preferences.call_completed}
            onValueChange={() => togglePreference("call_completed")}
            trackColor={{ false: "#767577", true: "#8d36ff" }}
            thumbColor={preferences.call_completed ? "#ffffff" : "#f4f3f4"}
            disabled={!preferences.enabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>
              {t("notifications.appointments", "Appointments")}
            </Text>
            <Text style={styles.preferenceDescription}>
              {t(
                "notifications.appointmentsDescription",
                "Notifications about scheduled appointments",
              )}
            </Text>
          </View>
          <Switch
            value={preferences.appointment_scheduled}
            onValueChange={() => togglePreference("appointment_scheduled")}
            trackColor={{ false: "#767577", true: "#8d36ff" }}
            thumbColor={
              preferences.appointment_scheduled ? "#ffffff" : "#f4f3f4"
            }
            disabled={!preferences.enabled}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>
              {t("notifications.appointmentReminders", "Appointment Reminders")}
            </Text>
            <Text style={styles.preferenceDescription}>
              {t(
                "notifications.appointmentRemindersDescription",
                "Reminders before scheduled appointments",
              )}
            </Text>
          </View>
          <Switch
            value={preferences.appointment_reminder}
            onValueChange={() => togglePreference("appointment_reminder")}
            trackColor={{ false: "#767577", true: "#8d36ff" }}
            thumbColor={
              preferences.appointment_reminder ? "#ffffff" : "#f4f3f4"
            }
            disabled={!preferences.enabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("notifications.deviceInformation")}
        </Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t("notifications.tokenStatus")}</Text>
          <Text style={styles.infoValue}>
            {expoPushToken
              ? t("notifications.registered")
              : t("notifications.notAvailable")}
          </Text>
        </View>
        {expoPushToken && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t("notifications.token")}</Text>
            <Text style={styles.infoValueSmall} numberOfLines={2}>
              {expoPushToken}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.testButton, isSyncing && styles.testButtonDisabled]}
          onPress={testNotification}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.testButtonText}>
              {t("notifications.sendTestNotification")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#8d36ff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  section: {
    backgroundColor: "white",
    marginVertical: 10,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  preferenceContent: {
    flex: 1,
    marginRight: 15,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 3,
  },
  preferenceDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  infoItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  infoValueSmall: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    fontFamily: "monospace",
  },
  actions: {
    padding: 20,
  },
  testButton: {
    backgroundColor: "#8d36ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  testButtonDisabled: {
    backgroundColor: "#b985ff",
  },
  testButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NotificationPreferencesScreen;
