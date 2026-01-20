// Exportar el servicio principal
export { default as NotificationService } from './NotificationService';

// Exportar el hook personalizado
export { useNotifications } from './useNotifications';

// Exportar configuraciones y tipos
export {
  AndroidChannels,
  ServerConfig,
  type PushNotificationPayload,
} from './config';

// Exportar componente de preferencias
export { default as NotificationPreferencesScreen } from './NotificationPreferencesScreen';

// Exportar provider
export { default as NotificationProvider } from './NotificationProvider';


// Exportar integración Django
export * from './djangoIntegration';

// Exportar tipos del servicio
export type {
  PushNotificationData,
  NotificationSubscription,
} from './NotificationService';