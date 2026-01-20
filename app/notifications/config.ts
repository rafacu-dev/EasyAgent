// Data structure for push notifications
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    [key: string]: any;
  };
}

// Android channels configuration
export const AndroidChannels = {
  DEFAULT: {
    channelId: 'default',
    channelName: 'General Notifications',
    channelDescription: 'General notifications from EasyAgent',
    importance: 4, // IMPORTANCE_HIGH
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8d36ff',
  },
  CALLS: {
    channelId: 'calls',
    channelName: 'Calls',
    channelDescription: 'Call and message notifications',
    importance: 4, // IMPORTANCE_HIGH
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8d36ff',
  },
  APPOINTMENTS: {
    channelId: 'appointments',
    channelName: 'Appointments',
    channelDescription: 'Scheduled appointment notifications',
    importance: 5, // IMPORTANCE_MAX
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#00ff00',
  },
  REMINDERS: {
    channelId: 'reminders',
    channelName: 'Reminders',
    channelDescription: 'Reminders and alerts',
    importance: 3, // IMPORTANCE_DEFAULT
    vibrationPattern: [0, 250],
    lightColor: '#ffaa00',
  },
};

// Server configuration for push notifications
export const ServerConfig = {
  // Your API URLs (change to your actual endpoints)
  REGISTER_TOKEN_URL: '/notifications/register',
  UNREGISTER_TOKEN_URL: '/notifications/unregister',
  UPDATE_PREFERENCES_URL: '/notifications/preferences',
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
};

export default {
  AndroidChannels,
  ServerConfig,
};