import { useRevenueCat } from '@/app/contexts/RevenueCatContext';

/**
 * Hook personalizado para acceder al estado de suscripción del usuario
 * 
 * @example
 * ```tsx
 * const { isProUser, isLoading } = useSubscription();
 * 
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (!isProUser) {
 *   return <PaywallScreen />;
 * }
 * 
 * return <PremiumContent />;
 * ```
 */
export function useSubscription() {
  const { isProUser, isLoading, customerInfo, refreshCustomerInfo } = useRevenueCat();

  return {
    /** Indica si el usuario tiene una suscripción activa */
    isProUser,
    /** Indica si se está cargando la información de suscripción */
    isLoading,
    /** Información completa del cliente de RevenueCat */
    customerInfo,
    /** Función para refrescar manualmente la información del cliente */
    refresh: refreshCustomerInfo,
  };
}
