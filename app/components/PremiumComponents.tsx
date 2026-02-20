import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSubscription } from '@/app/hooks/useSubscription';
import { router } from 'expo-router';
import { Colors } from '@/app/utils/colors';
import { FontAwesome } from '@expo/vector-icons';

/**
 * Componente que muestra contenido solo para usuarios premium
 * Si el usuario no es premium, muestra un botón para ir al paywall
 * 
 * @example
 * <PremiumGate>
 *   <AdvancedFeature />
 * </PremiumGate>
 */
interface PremiumGateProps {
  children: React.ReactNode;
  message?: string;
}

export function PremiumGate({ children, message }: PremiumGateProps) {
  const { isProUser, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isProUser) {
    return (
      <View style={styles.lockedContainer}>
        <FontAwesome name="lock" size={48} color={Colors.gray} />
        <Text style={styles.lockedText}>
          {message || 'Esta funcionalidad es exclusiva para usuarios Premium'}
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push('/paywall/PaywallScreen')}
        >
          <Text style={styles.upgradeButtonText}>⭐ Actualizar a Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Badge que muestra si el usuario es Premium
 * 
 * @example
 * <PremiumBadge />
 */
export function PremiumBadge() {
  const { isProUser, isLoading } = useSubscription();

  if (isLoading || !isProUser) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>⭐ PREMIUM</Text>
    </View>
  );
}

/**
 * Botón que ejecuta una acción solo si el usuario es premium
 * Si no es premium, lo redirige al paywall
 * 
 * @example
 * <PremiumButton 
 *   title="Análisis Avanzado" 
 *   onPress={() => console.log('Ejecutando')}
 * />
 */
interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
}

export function PremiumButton({ title, onPress, style }: PremiumButtonProps) {
  const { isProUser } = useSubscription();

  const handlePress = () => {
    if (!isProUser) {
      router.push('/paywall/PaywallScreen');
      return;
    }
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.premiumButton, style]} 
      onPress={handlePress}
    >
      <Text style={styles.premiumButtonText}>
        {isProUser ? `⭐ ${title}` : `🔒 ${title} (Premium)`}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Hook personalizado para verificar acceso a features premium
 * 
 * @example
 * const { checkPremium } = usePremiumCheck();
 * 
 * const handleAction = () => {
 *   if (!checkPremium()) return;
 *   // Tu lógica aquí
 * };
 */
export function usePremiumCheck() {
  const { isProUser } = useSubscription();

  const checkPremium = (showPaywall = true): boolean => {
    if (!isProUser && showPaywall) {
      router.push('/paywall/PaywallScreen');
    }
    return isProUser;
  };

  return { checkPremium, isProUser };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginVertical: 20,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
