# Guía de Gestión de Assets (Imágenes)

## Descripción General

Este proyecto utiliza un sistema centralizado para gestionar todas las referencias a imágenes ubicadas en `assets/images`. Todas las rutas de imágenes están centralizadas en el archivo `app/utils/assets.ts`.

## Ventajas del Sistema Centralizado

✅ **Consistencia**: Todas las imágenes se importan usando el alias `@/assets` independientemente de la ubicación del archivo
✅ **Mantenibilidad**: Un solo lugar para actualizar rutas de imágenes
✅ **Autocompletado**: TypeScript proporciona autocompletado para todas las imágenes disponibles
✅ **Seguridad de tipos**: Los errores de rutas incorrectas se detectan en tiempo de compilación
✅ **Fácil refactorización**: Cambiar la estructura de carpetas solo requiere actualizar un archivo

## Estructura del Sistema

### Archivo Principal: `app/utils/assets.ts`

Este archivo exporta las siguientes constantes:

#### 1. `AppImages`
Contiene todos los iconos y elementos visuales de la aplicación:
- `icon`: Icono principal de la app
- `splashIcon`: Icono del splash screen
- `splash`: Imagen de fondo del splash
- `favicon`: Favicon
- `bgIconSubscription`: Fondo de la suscripción
- Iconos adaptativos para Android

#### 2. `AgentImages`
Avatares de los agentes virtuales:
- `male`: Avatar masculino
- `female`: Avatar femenino

#### 3. `CategoryImages`
Iconos de categorías de negocios:
- `construction`: Construcción
- `barber`: Barbería
- `garden`: Jardinería
- `marketing`: Marketing
- `mechanic`: Mecánica
- `events`: Eventos
- `cleaner`: Limpieza
- `plumber`: Plomería
- `airConditioning`: Aire acondicionado

#### 4. `PaywallImages`
Imágenes para la pantalla de paywall:
- `support`: Soporte
- `translate`: Traducción
- `availability24`: Disponibilidad 24/7
- `calendar`: Calendario

#### 5. `OperatorLogos`
Logos de operadores telefónicos de EE.UU.:
- `att`, `verizon`, `tmobile`, `sprint`, `uscellular`, `cricket`, `metro`, `boost`, `visible`, `googlefi`

## Funciones Helper

### `getOperatorLogo(operatorId: string)`
Obtiene el logo de un operador por su ID.

```typescript
import { getOperatorLogo } from '@/app/utils/assets';

const logo = getOperatorLogo('verizon');
```

### `getAgentAvatar(gender: 'male' | 'female')`
Obtiene el avatar del agente según el género.

```typescript
import { getAgentAvatar } from '@/app/utils/assets';

const avatar = getAgentAvatar('female');
```

### `getCategoryImage(categoryId: string)`
Obtiene la imagen de una categoría por su ID.

```typescript
import { getCategoryImage } from '@/app/utils/assets';

const image = getCategoryImage('construction');
```

## Cómo Usar

### ❌ INCORRECTO (Forma Antigua)
```typescript
// NO HACER ESTO
import icon from "../../assets/images/icon.png";
<Image source={require("../assets/images/agent-m.jpg")} />
```

### ✅ CORRECTO (Forma Nueva)
```typescript
// HACER ESTO
import { AppImages, AgentImages } from '@/app/utils/assets';

// Usar en componentes
<Image source={AppImages.icon} />
<Image source={AgentImages.male} />
```

## Ejemplos de Uso

### Ejemplo 1: Icono de la App
```typescript
import { AppImages } from '@/app/utils/assets';

export default function SplashScreen() {
  return (
    <Image 
      source={AppImages.icon} 
      style={styles.icon}
    />
  );
}
```

### Ejemplo 2: Avatar del Agente
```typescript
import { AgentImages, getAgentAvatar } from '@/app/utils/assets';

export default function AgentProfile({ gender }) {
  // Opción 1: Acceso directo
  const avatar = gender === 'male' ? AgentImages.male : AgentImages.female;
  
  // Opción 2: Usar helper
  const avatar = getAgentAvatar(gender);
  
  return <Image source={avatar} style={styles.avatar} />;
}
```

### Ejemplo 3: Logo de Operador
```typescript
import { OperatorLogos, getOperatorLogo } from '@/app/utils/assets';

export default function CarrierList() {
  return carriers.map(carrier => (
    <Image 
      key={carrier.id}
      source={getOperatorLogo(carrier.id)} 
      style={styles.logo}
    />
  ));
}
```

### Ejemplo 4: Icono de Categoría
```typescript
import { CategoryImages } from '@/app/utils/assets';

const categories = [
  { id: 'construction', icon: CategoryImages.construction },
  { id: 'barber', icon: CategoryImages.barber },
  { id: 'garden', icon: CategoryImages.garden },
];

export default function CategoryList() {
  return categories.map(cat => (
    <Image key={cat.id} source={cat.icon} />
  ));
}
```

## Añadir Nuevas Imágenes

### Paso 1: Añadir la imagen a la carpeta correcta
```
assets/images/
  ├── nueva-imagen.png
  └── mi-categoria/
      └── icono-nuevo.png
```

### Paso 2: Actualizar `app/utils/assets.ts`
```typescript
export const AppImages = {
  // ... imágenes existentes
  nuevaImagen: require("@/assets/images/nueva-imagen.png"),
} as const;

// O si es una nueva categoría
export const MiNuevaCategoria = {
  iconoNuevo: require("@/assets/images/mi-categoria/icono-nuevo.png"),
} as const;
```

### Paso 3: Usar la nueva imagen
```typescript
import { AppImages } from '@/app/utils/assets';

<Image source={AppImages.nuevaImagen} />
```

## Migración de Código Existente

Si encuentras código antiguo que usa `require()` directamente:

1. Identifica la imagen y su ubicación
2. Verifica que esté en `app/utils/assets.ts`
3. Si no está, añádela siguiendo los pasos anteriores
4. Importa desde `@/app/utils/assets`
5. Reemplaza el `require()` con la constante correspondiente

## Estructura de Carpetas de Assets

```
assets/
└── images/
    ├── icon.png
    ├── splash-icon.png
    ├── splash.png
    ├── favicon.png
    ├── bg-icon-suscription.png
    ├── agent-m.jpg
    ├── agent-f.jpg
    ├── adaptive-icon.png
    ├── android-icon-*.png
    ├── categories/
    │   ├── construction.png
    │   ├── barber.png
    │   ├── garden.png
    │   ├── marketing.png
    │   ├── mechanic.png
    │   ├── events.png
    │   ├── cleaner.png
    │   ├── plumber.png
    │   └── air_conditioning.png
    ├── operators/
    │   ├── att.jpg
    │   ├── verizon.jpg
    │   ├── tmobile.jpg
    │   ├── sprint.jpg
    │   ├── uscellular.jpg
    │   ├── cricket.jpg
    │   ├── metro.jpg
    │   ├── boost.jpg
    │   ├── visible.jpg
    │   └── googlefi.jpg
    └── paywall/
        ├── support.png
        ├── translate.png
        ├── 24.png
        └── callendar.png
```

## Troubleshooting

### Error: Cannot find module '@/assets/images/...'
**Solución**: Verifica que el alias `@` esté configurado correctamente en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: Module not found
**Solución**: Asegúrate de que la imagen existe físicamente en la carpeta `assets/images/`.

### Las imágenes no se muestran
**Solución**: 
1. Limpia la caché de Metro: `npx expo start -c`
2. Verifica que uses `source={...}` y no `src={...}`
3. Asegúrate de usar `Image` de `react-native` no de HTML

## Archivos Actualizados

Los siguientes archivos han sido migrados al nuevo sistema:

- ✅ `app/utils/constants.ts` - Logos de operadores
- ✅ `app/index.tsx` - Icono de splash
- ✅ `app/paywall/PaywallScreen.tsx` - Iconos y fondos del paywall
- ✅ `app/intro/FirstLoginView.tsx` - Iconos de categorías
- ✅ `app/intro/agent-setup.tsx` - Avatares de agentes
- ✅ `app/edit-agent.tsx` - Avatares de agentes

## Mantenimiento

Cuando actualices o cambies imágenes:
1. Actualiza el archivo físico en `assets/images/`
2. Si cambia la ruta o nombre, actualiza `app/utils/assets.ts`
3. No necesitas cambiar ningún componente que ya use el sistema centralizado

---

**Última actualización**: Enero 2026
**Mantenido por**: Equipo de desarrollo EasyAgent
