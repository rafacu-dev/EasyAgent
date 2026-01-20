import { useEffect, useState, useRef } from "react";
import * as Notifications from "expo-notifications";
import NotificationService from "./NotificationService";

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  sendTokenToServer: () => Promise<boolean>;
  scheduleLocalNotification: (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ) => Promise<string | null>;
  cancelScheduledNotification: (identifier: string) => Promise<void>;
  clearBadgeCount: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const notificationService = useRef(NotificationService.getInstance());

  useEffect(() => {
    initializeNotifications();

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const initializeNotifications = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize notification service (doesn't return token, just sets up listeners)
      await notificationService.current.initialize();

      // Get token from service if available
      const token = notificationService.current.getToken();
      if (token) {
        setExpoPushToken(token);
      }

      // Setup listeners
      setupListeners();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error initializing notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupListeners = (): void => {
    // Listener para notificaciones recibidas
    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification: Notifications.Notification) => {
          setNotification(notification);
        }
      );

    // Listener para respuestas a notificaciones
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          console.log("Notification tapped:", response);
          handleNotificationTap(response);
        }
      );
  };

  const handleNotificationTap = (
    response: Notifications.NotificationResponse
  ): void => {
    const { data } = response.notification.request.content;

    // Handle navigation based on notification data
    if (data?.screen) {
      console.log("📱 Navigating to screen:", data.screen);
      // Navigation is handled in NotificationService
    }

    // Handle specific notification types for EasyAgent
    if (data?.type) {
      switch (data.type) {
        case "call_completed":
          console.log("Call completed notification tapped");
          // Navigation handled by data.screen
          break;
        case "appointment_scheduled":
          console.log("Appointment scheduled notification tapped");
          break;
        case "agent_updated":
          console.log("Agent updated notification tapped");
          break;
        case "phone_number_added":
          console.log("Phone number added notification tapped");
          break;
        default:
          console.log("Notification tapped:", data.type);
      }
    }
  };

  const sendTokenToServer = async (): Promise<boolean> => {
    try {
      return await notificationService.current.sendTokenToServer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send token to server"
      );
      return false;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string | null> => {
    try {
      return await notificationService.current.scheduleLocalNotification(
        title,
        body,
        trigger,
        data
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to schedule notification"
      );
      return null;
    }
  };

  const cancelScheduledNotification = async (
    identifier: string
  ): Promise<void> => {
    try {
      await notificationService.current.cancelScheduledNotification(identifier);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel notification"
      );
    }
  };

  const clearBadgeCount = async (): Promise<void> => {
    try {
      await notificationService.current.clearBadgeCount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to clear badge count"
      );
    }
  };

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    sendTokenToServer,
    scheduleLocalNotification,
    cancelScheduledNotification,
    clearBadgeCount,
  };
};

export default useNotifications;
