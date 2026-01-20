import { BaseUrl } from '@/utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';


// Obtener información del dispositivo usando expo-device
const getDeviceInfo = async () => {
    return {
        platform: Platform.OS,
        deviceName: Device.deviceName,
        deviceType: Device.deviceType,
        osName: Device.osName,
        osVersion: Device.osVersion,
        appVersion: Constants.expoConfig?.version || '1.0',
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
    };
};

// Obtener token de autenticación
const getUserAuthToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem('user_auth_token');
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

// Headers por defecto para las requests
const getDefaultHeaders = async () => {
  const token = await getUserAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
  };
};

/**
 * Registrar token de dispositivo en el servidor Django
 */
export const registerDeviceTokenWithDjango = async (expoPushToken: string): Promise<boolean> => {
    try {
        const deviceInfo = await getDeviceInfo();
        const headers = await getDefaultHeaders();
        
        const response = await fetch(`${BaseUrl}notifications/register/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                token: expoPushToken,
                platform: deviceInfo.platform,
                deviceName: deviceInfo.deviceName,
                deviceType: deviceInfo.deviceType,
                osName: deviceInfo.osName,
                osVersion: deviceInfo.osVersion,
                appVersion: deviceInfo.appVersion,
                projectId: deviceInfo.projectId,
            }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Device token registered with Django server:', String(data));
        return data.success;
        } else {
        console.log('Failed to register device token:', String(response.status));
        return false;
        }
    } catch (error) {
        console.log('Error registering device token:', String(error));
        return false;
    }
};

/**
 * Desregistrar token de dispositivo del servidor Django
 */
export const unregisterDeviceTokenFromDjango = async (expoPushToken: string): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();

        const response = await fetch(`${BaseUrl}notifications/unregister-token/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            token: expoPushToken,
        }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Device token unregistered from Django server:', data);
        return data.success;
        } else {
        console.error('Failed to unregister device token:', response.status);
        return false;
        }
    } catch (error) {
        console.error('Error unregistering device token:', error);
        return false;
    }
};

/**
 * Notificar al servidor Django cuando se crea una factura
 */
export const notifyInvoiceCreatedToServer = async (invoiceData: {
  id: string;
  number: string;
  amount: number;
  clientName: string;
}): Promise<boolean> => {
  try {
    const headers = await getDefaultHeaders();
    const response = await fetch(`${BaseUrl}notifications/invoice/${invoiceData.id}/created/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoice_number: invoiceData.number,
        amount: invoiceData.amount,
        client_name: invoiceData.clientName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Invoice creation notification sent to server:', data);
      return data.success;
    } else {
      console.error('Failed to send invoice creation notification:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error sending invoice creation notification:', error);
    return false;
  }
};

/**
 * Notificar al servidor Django cuando se recibe un pago
 */
export const notifyPaymentReceivedToServer = async (paymentData: {
    id: string;
    amount: number;
    clientName: string;
    invoiceNumber: string;
    }): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/payment/${paymentData.id}/received/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            amount: paymentData.amount,
            client_name: paymentData.clientName,
            invoice_number: paymentData.invoiceNumber,
        }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Payment notification sent to server:', data);
        return data.success;
        } else {
        console.error('Failed to send payment notification:', response.status);
        return false;
        }
    } catch (error) {
        console.error('Error sending payment notification:', error);
        return false;
    }
};

/**
 * Notificar al servidor Django cuando se añade un cliente
 */
export const notifyClientAddedToServer = async (clientData: {
    id: string;
    name: string;
    email?: string;
    }): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/client/${clientData.id}/added/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            name: clientData.name,
            email: clientData.email || '',
        }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Client added notification sent to server:', data);
        return data.success;
        } else {
        console.error('Failed to send client added notification:', response.status);
        return false;
        }
    } catch (error) {
        console.error('Error sending client added notification:', error);
        return false;
    }
};

/**
 * Sincronizar preferencias de notificación con el servidor
 */
export const syncNotificationPreferences = async (preferences: Record<string, boolean>): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();
        
        // Convertir preferencias al formato esperado por Django
        const preferencesArray = Object.entries(preferences).map(([type, enabled]) => ({
        notification_type: type,
        is_enabled: enabled,
        }));

        const response = await fetch(`${BaseUrl}notifications/preferences/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            preferences: preferencesArray,
        }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Preferences synced with server:', data);
        return data.success;
        } else {
        console.error('Failed to sync preferences:', response.status);
        return false;
        }
    } catch (error) {
        console.error('Error syncing preferences:', error);
        return false;
    }
};

/**
 * Obtener preferencias de notificación desde el servidor
 */
export const getNotificationPreferencesFromServer = async (): Promise<Record<string, boolean> | null> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/preferences/`, {
        method: 'GET',
        headers,
        });

        if (response.ok) {
        const preferences = await response.json();
        
        // Convertir array de Django a objeto
        const preferencesObject: Record<string, boolean> = {};
        preferences.forEach((pref: any) => {
            preferencesObject[pref.notification_type] = pref.is_enabled;
        });

        return preferencesObject;
        } else {
        console.error('Failed to get preferences from server:', response.status);
        return null;
        }
    } catch (error) {
        console.error('Error getting preferences from server:', error);
        return null;
    }
};

/**
 * Obtener historial de notificaciones desde el servidor
 */
export const getNotificationHistory = async (): Promise<any[] | null> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/history/`, {
        method: 'GET',
        headers,
        });

        if (response.ok) {
        const history = await response.json();
        return history;
        } else {
        console.error('Failed to get notification history:', response.status);
        return null;
        }
    } catch (error) {
        console.error('Error getting notification history:', error);
        return null;
    }
};

/**
 * Programar notificación en el servidor
 */
export const scheduleNotificationOnServer = async (notificationData: {
    title: string;
    body: string;
    notification_type: string;
    scheduled_for: Date;
    data?: any;
    invoice_id?: string;
    client_id?: string;
    payment_id?: string;
    }): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/schedule/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            ...notificationData,
            scheduled_for: notificationData.scheduled_for.toISOString(),
        }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Notification scheduled on server:', data);
        return data.success;
        } else {
        console.error('Failed to schedule notification on server:', response.status);
        return false;
        }
    } catch (error) {
        console.error('Error scheduling notification on server:', error);
        return false;
    }
};

/**
 * Validar conexión con el servidor
 */
export const validateServerConnection = async (): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/ping/`, {
        method: 'GET',
        headers,
        });

        return response.ok;
    } catch (error) {
        console.error('Server connection failed:', error);
        return false;
    }
};

/**
 * Obtener estadísticas de notificaciones
 */
export const getNotificationStats = async (): Promise<any | null> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/stats/`, {
        method: 'GET',
        headers,
        });

        if (response.ok) {
        return await response.json();
        } else {
        console.error('Failed to get notification stats:', response.status);
        return null;
        }
    } catch (error) {
        console.error('Error getting notification stats:', error);
        return null;
    }
};

/**
 * Desregistrar token del servidor
 */
export const unregisterTokenFromServer = async (token: string): Promise<boolean> => {
    try {
        const headers = await getDefaultHeaders();
        const response = await fetch(`${BaseUrl}notifications/unregister/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token }),
        });

        if (response.ok) {
        const data = await response.json();
        console.log('Token unregistered from server:', data);
        return data.success;
        } else {
        console.error('Failed to unregister token:', response.status);
        return false;
        }
    } catch (error) {
        console.error('Error unregistering token:', error);
        return false;
    }
};

// Exportar configuración del servidor para uso externo
export const serverConfig = {
    getUserAuthToken,
    getDefaultHeaders,
};

export default {
    notifyInvoiceCreatedToServer,
    notifyPaymentReceivedToServer,
    notifyClientAddedToServer,
    syncNotificationPreferences,
    getNotificationPreferencesFromServer,
    getNotificationHistory,
    scheduleNotificationOnServer,
    validateServerConnection,
    getNotificationStats,
    unregisterTokenFromServer,
    serverConfig,
};