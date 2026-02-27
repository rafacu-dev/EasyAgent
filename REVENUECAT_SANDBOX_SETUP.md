# Configuración de RevenueCat en Modo Sandbox

## ⚠️ Problema Actual
Las suscripciones no se muestran en la aplicación porque estamos en modo sandbox y la app aún no está en la App Store.

## 📋 Pasos Requeridos

### 1. Configurar Productos en App Store Connect

1. **Ir a App Store Connect** (https://appstoreconnect.apple.com)
2. **Seleccionar tu app** → **Monetización** → **Suscripciones**
3. **Crear un Grupo de Suscripciones** si no existe
4. **Crear las suscripciones**:
   - Plan Mensual: `com.easyagent.monthly` o similar
   - Plan Anual: `com.easyagent.annual` o similar
   
5. **IMPORTANTE**: Los productos deben estar en estado **"Ready to Submit"** o **"Pending Developer Release"**

### 2. Sincronizar con RevenueCat

1. **Ir al Dashboard de RevenueCat** (https://app.revenuecat.com)
2. **Seleccionar tu proyecto** → **Products**
3. **Hacer clic en "Import from Apple"** (puede tardar hasta 24 horas en sincronizar)
4. **Verificar que los productos aparezcan** en la lista

### 3. Crear Offerings en RevenueCat

1. En RevenueCat: **Offerings** → **Create New Offering**
2. **Configurar el Offering**:
   - Identifier: `default` (o el nombre que prefieras)
   - Description: Descripción del plan
3. **Agregar Packages** al Offering:
   - Crear un package para el plan mensual
   - Crear un package para el plan anual
   - Asignar los productos de App Store Connect a cada package
4. **Marcar el Offering como "Current"**

### 4. Configurar Usuario de Prueba Sandbox

1. **Crear un usuario sandbox** en App Store Connect:
   - Ve a **Usuarios y Acceso** → **Sandbox Testers**
   - Crea un nuevo usuario de prueba
   - Usa un email que NO sea tu Apple ID real

2. **En tu dispositivo iOS**:
   - Ve a **Ajustes** → **App Store** → **Sandbox Account**
   - Inicia sesión con el usuario sandbox que creaste
   - **NO inicies sesión con tu Apple ID real** para pruebas sandbox

### 5. Probar la Aplicación

1. **Hacer un build de desarrollo**:
   ```bash
   npx expo run:ios
   ```
   O si ya tienes un build:
   ```bash
   eas build --profile development --platform ios
   ```

2. **Revisar los logs en la consola** cuando abras el paywall:
   - Busca los mensajes de RevenueCat
   - Deberías ver: `✅ Offering found with X packages`
   - Si ves: `❌ No offerings or packages available`, revisa los pasos anteriores

### 6. Solución de Problemas Comunes

#### No aparecen ofertas en la app

- ✅ Verifica que los productos en App Store Connect estén en "Ready to Submit"
- ✅ Espera hasta 24 horas para la sincronización entre Apple y RevenueCat
- ✅ Revisa que el Offering en RevenueCat esté marcado como "Current"
- ✅ Verifica que estás usando un usuario sandbox, no tu Apple ID real
- ✅ Usa el botón "Reintentar" en la app para recargar las ofertas

#### Error al comprar

- ✅ Asegúrate de estar usando un usuario sandbox
- ✅ Verifica que el dispositivo tenga conexión a internet
- ✅ Cierra sesión del App Store y vuelve a iniciar con el usuario sandbox
- ✅ Elimina la app y reinstálala

#### La compra no se refleja

- ✅ En sandbox, los períodos de prueba se aceleran
- ✅ Revisa en RevenueCat Dashboard → Customers si la compra se registró
- ✅ Verifica los logs de la consola para ver el estado de la suscripción

### 7. Configuración de Entitlements en RevenueCat

1. Ve a **Entitlements** en el dashboard de RevenueCat
2. Crea un entitlement llamado `premium` (o el nombre que uses en tu código)
3. Asocia todos los productos (mensual, anual) a este entitlement
4. Esto permitirá que el código verifique: `customerInfo.entitlements.active.premium`

## 🔍 Verificar Configuración Actual

Ejecuta la app en modo desarrollo y revisa la consola. Los nuevos logs te mostrarán:

- 🔍 Si se están obteniendo las ofertas
- 📦 Cuántos packages hay disponibles
- ✅ Si el offering se cargó correctamente
- ❌ Errores específicos si algo falla

## 📱 Testing en Producción

Cuando la app esté en la App Store:

1. El modo sandbox ya no será necesario
2. Los usuarios reales podrán comprar con sus Apple IDs reales
3. Las suscripciones se procesarán normalmente
4. RevenueCat sincronizará automáticamente las compras

## 🆘 Ayuda Adicional

- **Documentación de RevenueCat**: https://www.revenuecat.com/docs
- **Guía de Sandbox Testing**: https://www.revenuecat.com/docs/test-purchases
- **Dashboard de RevenueCat**: https://app.revenuecat.com

---

**Última actualización**: Febrero 2026
