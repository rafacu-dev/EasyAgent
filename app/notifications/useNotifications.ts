import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService from './NotificationService';

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
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
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

      // Inicializar el servicio de notificaciones
      const token = await notificationService.current.initialize();
      
      if (token) {
        setExpoPushToken(token);
      } else {
        setError('Failed to get push notification token');
      }

      // Configurar listeners
      setupListeners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error initializing notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupListeners = (): void => {
    // Listener para notificaciones recibidas
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        setNotification(notification);
      }
    );

    // Listener para respuestas a notificaciones
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification tapped:', response);
        handleNotificationTap(response);
      }
    );
  };

  const handleNotificationTap = (response: Notifications.NotificationResponse): void => {
    const { data } = response.notification.request.content;
    
    // Aquí puedes manejar la navegación o acciones específicas
    if (data?.action) {
      switch (data.action) {
        case 'open_invoice':
          // Navegar a factura específica
          console.log('Opening invoice:', data.invoiceId);
          break;
        case 'open_client':
          // Navegar a cliente específico
          console.log('Opening client:', data.clientId);
          break;
        case 'open_payment':
          // Navegar a pago específico
          console.log('Opening payment:', data.paymentId);
          break;
        default:
          console.log('Unknown notification action:', data.action);
      }
    }
  };

  const sendTokenToServer = async (): Promise<boolean> => {
    try {
      return await notificationService.current.sendTokenToServer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send token to server');
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
      return await notificationService.current.scheduleLocalNotification(title, body, trigger, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule notification');
      return null;
    }
  };

  const cancelScheduledNotification = async (identifier: string): Promise<void> => {
    try {
      await notificationService.current.cancelScheduledNotification(identifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel notification');
    }
  };

  const clearBadgeCount = async (): Promise<void> => {
    try {
      await notificationService.current.clearBadgeCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear badge count');
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