# 🎯 Contexto de RevenueCat / Purchases

Este contexto centraliza toda la lógica de suscripciones y pagos usando RevenueCat, permitiendo verificar el estado de suscripción del usuario desde cualquier vista de la aplicación.

## 📁 Archivos Creados

- **`app/contexts/RevenueCatContext.tsx`**: Contexto principal que maneja RevenueCat
- **`app/hooks/useSubscription.ts`**: Hook personalizado para acceder al estado de suscripción
- **`app/contexts/RevenueCatExamples.tsx`**: Ejemplos de uso del contexto

## 🚀 Uso Rápido

### 1. Verificar si el usuario tiene suscripción

```tsx
import { useSubscription } from '@/app/hooks/useSubscription';

function MyComponent() {
  const { isProUser, isLoading } = useSubscription();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      {isProUser ? (
        <PremiumContent />
      ) : (
        <FreeTierContent />
      )}
    </View>
  );
}
```

### 2. Proteger una funcionalidad premium

```tsx
import { useSubscription } from '@/app/hooks/useSubscription';
import { router } from 'expo-router';

function MyFeature() {
  const { isProUser } = useSubscription();

  const handlePremiumAction = () => {
    if (!isProUser) {
      router.push('/paywall/PaywallScreen');
      return;
    }
    
    // Tu lógica premium aquí
    console.log('Acción premium ejecutada');
  };

  return (
    <TouchableOpacity onPress={handlePremiumAction}>
      <Text>{isProUser ? '⭐ Premium' : '🔒 Actualizar'}</Text>
    </TouchableOpacity>
  );
}
```

### 3. Componente de Feature Flag

Puedes usar el componente `PremiumFeature` de los ejemplos:

```tsx
import { PremiumFeature } from '@/app/contexts/RevenueCatExamples';

function MyScreen() {
  return (
    <View>
      {/* Contenido disponible para todos */}
      <BasicContent />
      
      {/* Contenido solo para usuarios premium */}
      <PremiumFeature fallback={<Text>Actualiza para ver esto</Text>}>
        <AdvancedAnalytics />
      </PremiumFeature>
    </View>
  );
}
```

## 🔧 API del Contexto

### Hook `useSubscription()`

```tsx
const {
  isProUser,        // boolean: ¿El usuario tiene suscripción activa?
  isLoading,        // boolean: ¿Se está cargando la información?
  customerInfo,     // CustomerInfo | null: Información completa del cliente
  refresh,          // () => Promise<void>: Actualizar información manualmente
} = useSubscription();
```

### Hook completo `useRevenueCat()`

Para operaciones avanzadas:

```tsx
import { useRevenueCat } from '@/app/contexts/RevenueCatContext';

const {
  isProUser,
  isLoading,
  customerInfo,
  refreshCustomerInfo,
  purchasePackage,    // (pkg) => Promise<{success, error?}>
  restorePurchases,   // () => Promise<{success, error?}>
} = useRevenueCat();
```

## 📋 Casos de Uso Comunes

### Mostrar/Ocultar Funcionalidades

```tsx
const { isProUser } = useSubscription();

return (
  <View>
    <BasicFeature />
    {isProUser && <PremiumFeature />}
  </View>
);
```

### Navegación Condicional

```tsx
const { isProUser } = useSubscription();

const handleNavigate = () => {
  if (isProUser) {
    router.push('/premium-screen');
  } else {
    router.push('/paywall/PaywallScreen');
  }
};
```

### Actualizar después de una compra

```tsx
const { refresh } = useSubscription();

const handlePurchaseComplete = async () => {
  await refresh(); // Actualiza el estado de suscripción
  router.replace('/home'); // Navega a home
};
```

## 🎨 Actualización del Paywall

Si quieres actualizar tu `PaywallScreen.tsx` para usar el contexto:

```tsx
import { useRevenueCat } from '@/app/contexts/RevenueCatContext';

export function PaywallScreen() {
  const { purchasePackage, restorePurchases, isProUser } = useRevenueCat();
  
  // Ya no necesitas inicializar Purchases aquí
  // Ya no necesitas verificar customerInfo manualmente
  
  const handlePurchase = async (pkg: PurchasesPackage) => {
    const result = await purchasePackage(pkg);
    if (result.success) {
      showSuccess('¡Compra exitosa!');
      router.replace('/home');
    } else if (result.error) {
      showError(result.error);
    }
  };

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      showSuccess('¡Compras restauradas!');
      router.replace('/home');
    } else {
      showInfo('No se encontraron compras');
    }
  };
  
  // ...resto del componente
}
```

## ✅ Ventajas

- ✨ **Global**: Acceso desde cualquier componente
- 🔄 **Sincronizado**: Estado actualizado automáticamente
- 🎯 **Simple**: API limpia y fácil de usar
- 📦 **Tipado**: Full TypeScript support
- 🚀 **Optimizado**: Una sola instancia de Purchases
- 🔒 **Seguro**: Manejo de errores incluido

## 📝 Notas Importantes

1. **Inicialización automática**: El contexto se inicializa automáticamente en `_layout.tsx`
2. **Estado persistente**: El estado se mantiene durante toda la sesión de la app
3. **Android**: Descomenta el código de Android en `RevenueCatContext.tsx` cuando tengas la API key
4. **Verificación en background**: El estado se actualiza automáticamente cuando la app vuelve de background

## 🐛 Debugging

Para ver los logs de RevenueCat:

```tsx
// Ya está configurado en el contexto con LOG_LEVEL.VERBOSE
// Los logs aparecerán en la consola con prefijos:
// ✅ = éxito
// ❌ = error
// 🔄 = actualización
```

## 📚 Más Ejemplos

Revisa el archivo `app/contexts/RevenueCatExamples.tsx` para ver más ejemplos detallados de uso.
