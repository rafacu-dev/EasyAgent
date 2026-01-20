// Exportar el servicio principal
export { default as NotificationService } from "./NotificationService";

// Exportar el hook personalizado
export { useNotifications } from "./useNotifications";

// Exportar configuraciones y tipos
export {
  AndroidChannels,
  ServerConfig,
  type PushNotificationPayload,
} from "./config";

// Exportar componente de preferencias
export { default as NotificationPreferencesScreen } from "./NotificationPreferencesScreen";

// Exportar provider
export { default as NotificationProvider } from "./NotificationProvider";

// Exportar integración EasyAgent (reemplaza djangoIntegration para invoice)
export * from "./easyAgentNotifications";

// Exportar tipos del servicio
export type {
  PushNotificationData,
  NotificationSubscription,
} from "./NotificationService";

// Deprecated: Mantener para compatibilidad, usar easyAgentNotifications en su lugar
// export * from './djangoIntegration';
