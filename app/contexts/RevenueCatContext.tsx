import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isProUser: boolean;
  isLoading: boolean;
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar Purchases
  useEffect(() => {
    const initializePurchases = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        
        if (Platform.OS === 'ios') {
          await Purchases.configure({
            apiKey: Constants.expoConfig?.extra?.rcApplApiKey,
          });
        } else if (Platform.OS === 'android') {
          await Purchases.configure({
            apiKey: Constants.expoConfig?.extra?.rcGooglApiKey,
          });
        }

        // Obtener información del cliente después de inicializar
        await refreshCustomerInfo();
        
        console.log('✅ RevenueCat initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing RevenueCat:', error);
        setIsLoading(false);
      }
    };

    initializePurchases();
  }, []);

  // Función para actualizar la información del cliente
  const refreshCustomerInfo = async () => {
    try {
      setIsLoading(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Verificar si el usuario tiene una suscripción activa
      const hasActiveEntitlement = Object.keys(info.entitlements.active).length > 0;
      setIsProUser(hasActiveEntitlement);
      
      console.log('🔄 Customer info updated:', {
        hasActiveEntitlement,
        activeEntitlements: Object.keys(info.entitlements.active),
        activeSubscriptions: info.activeSubscriptions,
      });
    } catch (error) {
      console.error('❌ Error refreshing customer info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para comprar un paquete
  const purchasePackage = async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
    try {
      const purchaseResult = await Purchases.purchasePackage(pkg);
      setCustomerInfo(purchaseResult.customerInfo);
      
      // Verificar si la compra fue exitosa
      const hasActiveEntitlement = Object.keys(purchaseResult.customerInfo.entitlements.active).length > 0;
      setIsProUser(hasActiveEntitlement);

      console.log('✅ Purchase successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error purchasing package:', error);
      
      // No mostrar error si el usuario canceló
      if (error.userCancelled) {
        return { success: false };
      }
      
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  // Función para restaurar compras
  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      const hasActiveEntitlement = Object.keys(info.entitlements.active).length > 0;
      setIsProUser(hasActiveEntitlement);

      console.log('✅ Purchases restored successfully');
      return { success: hasActiveEntitlement };
    } catch (error: any) {
      console.error('❌ Error restoring purchases:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  const value: RevenueCatContextType = {
    customerInfo,
    isProUser,
    isLoading,
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
