import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { apiClient } from "@/app/utils/axios-interceptor";
import { router } from "expo-router";

// Configuration for how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
}

export interface NotificationSubscription {
  token: string;
  deviceId?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Inicializar el servicio de notificaciones (sin solicitar permisos)
  async initialize(): Promise<void> {
    try {
      // Configurar listeners solamente
      this.setupNotificationListeners();

      // Intentar recuperar token guardado previamente
      const savedToken = await this.getTokenFromStorage();
      if (savedToken) {
        this.expoPushToken = savedToken;
      }
    } catch (error) {
      console.error("Error initializing notification service:", error);
    }
  }

  // Solicitar permisos y registrar para notificaciones push (llamar DESPUÉS de AppsFlyer)
  async requestPermissionsAndRegister(): Promise<string | null> {
    try {
      // Registrar para notificaciones push
      const token = await this.registerForPushNotificationsAsync();

      if (token) {
        this.expoPushToken = token;
        await this.saveTokenToStorage(token);

        return token;
      }

      return null;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return null;
    }
  }

  // Registrar para notificaciones push
  private async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1f5bff7c",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return null;
      }

      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId:
            Constants.expoConfig?.extra?.eas?.projectId ||
            "70e433ab-14f4-4bbc-8070-e2adf248202d",
        });
        token = pushTokenData.data;
      } catch (error) {
        console.error("Error getting push token:", error);
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
    }

    return token;
  }

  // Configurar listeners para notificaciones
  private setupNotificationListeners(): void {
    // Listener para cuando se recibe una notificación mientras la app está activa
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        this.handleNotificationReceived(notification);
      },
    );

    // Listener para cuando el usuario toca una notificación
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
        this.handleNotificationResponse(response);
      });
  }

  // Handle received notification
  private handleNotificationReceived(
    notification: Notifications.Notification,
  ): void {
    const { title, body, data } = notification.request.content;

    // You can add specific logic based on notification type here
    console.log(`Received notification: ${title} - ${body}`);

    // Example: update badge count
    if (data?.updateBadge) {
      const badgeCount =
        typeof data.badgeCount === "number" ? data.badgeCount : 1;
      Notifications.setBadgeCountAsync(badgeCount);
    }
  }

  // Handle notification response (when user taps it)
  private handleNotificationResponse(
    response: Notifications.NotificationResponse,
  ): void {
    const { data } = response.notification.request.content;

    // Navigate based on notification data
    if (data?.screen && typeof data.screen === "string") {
      console.log(`📱 Navigating to: ${data.screen}`);
      try {
        router.push(data.screen as any);
      } catch (error) {
        console.error("❌ Navigation error:", error);
      }
    }
  }

  // Obtener token actual
  getToken(): string | null {
    return this.expoPushToken;
  }

  // Enviar token al servidor usando apiClient (que ya envía company_id como query)
  async sendTokenToServer(): Promise<boolean> {
    try {
      if (!this.expoPushToken) {
        console.warn("⚠️ No push token available");
        return false;
      }

      // Check if user is authenticated first
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        console.warn("⚠️ User not authenticated, skipping token registration");
        return false;
      }

      // Guardar el token localmente primero
      await this.saveTokenToStorage(this.expoPushToken);

      // Obtener información del dispositivo
      const deviceId = await this.getDeviceId();
      const deviceInfo = {
        push_token: this.expoPushToken,
        device_id: deviceId,
        platform: Platform.OS,
        device_name: Device.deviceName || "Unknown",
        device_model: Device.modelName || "Unknown",
        os_version: Device.osVersion || "Unknown",
      };

      console.log("📱 Registering push token with backend...", {
        platform: deviceInfo.platform,
        device_name: deviceInfo.device_name,
      });

      // Use apiClient which automatically includes authentication
      const response = await apiClient.post(
        "/notifications/register/",
        deviceInfo,
      );

      console.log("✅ Device token registered successfully:", response.data);
      return true;
    } catch (error: any) {
      console.error("❌ Error registering device token:", error);
      if (error.response) {
        console.error("❌ Response status:", error.response.status);
        console.error("❌ Response data:", error.response.data);
      }
      return false;
    }
  }

  // Get user authentication token
  private async getUserAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("user_auth_token");
    } catch (error) {
      console.error("Error getting user auth token:", error);
      return null;
    }
  }

  // Programar notificación local
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any,
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error("Error scheduling local notification:", error);
      return null;
    }
  }

  // Cancelar notificación programada
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error("Error canceling scheduled notification:", error);
    }
  }

  // Obtener todas las notificaciones programadas
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  // Limpiar badge count
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error("Error clearing badge count:", error);
    }
  }

  // Obtener ID único del dispositivo usando expo-device
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem("device_id");
      if (!deviceId) {
        // Usar información más específica del dispositivo con expo-device
        const deviceInfo =
          Device.osBuildId || Device.osInternalBuildId || Date.now().toString();
        deviceId = `${Platform.OS}_${deviceInfo}_${Math.random()
          .toString(36)
          .substring(2)}`;
        await AsyncStorage.setItem("device_id", deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error("Error getting device ID:", error);
      return `${Platform.OS}_${Date.now()}`;
    }
  }

  // Guardar token en storage local
  private async saveTokenToStorage(token: string): Promise<void> {
    try {
      // Guardar con ambas claves para compatibilidad
      await AsyncStorage.setItem("expo_push_token", token);
      await AsyncStorage.setItem("push_notification_token", token);
    } catch (error) {
      console.error("Error saving token to storage:", error);
    }
  }

  // Obtener token del storage local
  async getTokenFromStorage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("expo_push_token");
    } catch (error) {
      console.error("Error getting token from storage:", error);
      return null;
    }
  }

  // Cleanup listeners
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export default NotificationService;
