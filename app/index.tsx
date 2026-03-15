import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import FirstLoginView from "./intro/FirstLoginView";
import { useAgentQuery } from "@/app/hooks";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { useSubscription } from "@/app/hooks/useSubscription";

export default function Index() {
  const { t } = useTranslation();
  const [showingSplash, setShowingSplash] = useState(true);
  const [splashStatus, setSplashStatus] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [splashStartTime] = useState<number>(Date.now());
  
  // Solo cargar datos si el usuario está autenticado
  const { data: agentConfig, isLoading: agentLoading } = useAgentQuery({
    enabled: isAuthenticated === true,
  });
  const { isProUser, isLoading: subscriptionLoading } = useSubscription();

  // Inicialización completa en el splash: Updates + Auth + Data loading
  useEffect(() => {
    const initializeApp = async () => {
      const startTime = Date.now();
      const minimumSplashDuration = 5000; // 5 seconds

      try {
        // ═══════════════════════════════════════
        // PASO 1: VERIFICAR Y APLICAR ACTUALIZACIONES OTA
        // ═══════════════════════════════════════
        console.log("🔄 [OTA] ═══════════════════════════════════════");
        console.log("🔄 [OTA] PASO 1: Verificación de actualizaciones");
        console.log("🔄 [OTA] Updates.isEnabled:", Updates.isEnabled);
        console.log("🔄 [OTA] Updates.channel:", Updates.channel || "none");
        console.log("🔄 [OTA] Updates.updateId:", Updates.updateId || "none");
        console.log("🔄 [OTA] Updates.isEmbeddedLaunch:", Updates.isEmbeddedLaunch);
        console.log("🔄 [OTA] __DEV__:", __DEV__);
        console.log("🔄 [OTA] ═══════════════════════════════════════");

        // expo-updates no funciona en Expo Go
        if (Updates.isEnabled && !__DEV__) {
          try {
            setSplashStatus(
              t("index.checkingUpdates", "Buscando actualizaciones..."),
            );

            const update = await Updates.checkForUpdateAsync();
            console.log("🔄 [OTA] Resultado:", {
              isAvailable: update.isAvailable,
              manifest: update.manifest,
            });

            if (update.isAvailable) {
              console.log("✅ [OTA] ¡Actualización disponible! Descargando...");
              setSplashStatus(
                t("index.downloadingUpdate", "Descargando actualización..."),
              );
              
              const fetchResult = await Updates.fetchUpdateAsync();
              console.log("✅ [OTA] Actualización descargada:", {
                isNew: fetchResult.isNew,
              });

              if (fetchResult.isNew) {
                setSplashStatus(
                  t("index.applyingUpdate", "Aplicando actualización..."),
                );
                console.log("✅ [OTA] Reiniciando app con nueva versión...");
                await Updates.reloadAsync();
                return; // La app se reiniciará, no continuar
              }
            } else {
              console.log("✅ [OTA] App actualizada, continuando...");
            }
          } catch (error) {
            console.log("⚠️ [OTA] Error verificando updates (probablemente Expo Go):", error);
          }
        } else {
          console.log("⚠️ [OTA] Updates deshabilitados (desarrollo/Expo Go)");
        }

        // ═══════════════════════════════════════
        // PASO 2: VERIFICAR AUTENTICACIÓN
        // ═══════════════════════════════════════
        console.log("🔐 [AUTH] PASO 2: Verificando autenticación...");
        setSplashStatus(t("index.checkingAuth", "Verificando autenticación..."));
        
        const authToken = await AsyncStorage.getItem("authToken");
        setIsAuthenticated(!!authToken);
        console.log("🔐 [AUTH] Resultado:", authToken ? "Autenticado" : "No autenticado");

        if (!authToken) {
          // No autenticado, asegurar tiempo mínimo de splash y redirigir
          const elapsedTime = Date.now() - startTime;
          const remainingTime = minimumSplashDuration - elapsedTime;
          if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }
          
          console.log("🔐 [AUTH] Redirigiendo a login...");
          router.replace("/login" as any);
          return;
        }

        // ═══════════════════════════════════════
        // PASO 3: CARGAR DATOS (agente y suscripción)
        // ═══════════════════════════════════════
        console.log("📊 [DATA] PASO 3: Esperando carga de datos...");
        console.log("📊 [DATA] - isAuthenticated:", !!authToken);
        console.log("📊 [DATA] - Iniciando useAgentQuery y useSubscription");
        setSplashStatus(t("index.loadingData", "Cargando datos..."));
        // Los datos se cargan automáticamente con useAgentQuery y useSubscription
        // El siguiente useEffect manejará la navegación cuando estén listos
        
      } catch (error) {
        console.error("❌ [INIT] Error durante inicialización:", error);
        if (error instanceof Error) {
          console.error("❌ [INIT] Mensaje:", error.message);
          console.error("❌ [INIT] Stack:", error.stack);
        }
        // Continuar con flujo normal aunque falle
      }
    };

    initializeApp();
  }, [t]);

  // Navegar cuando todos los datos estén listos (después de updates y auth)
  useEffect(() => {
    console.log("🔍 [NAV-CHECK]", {
      isAuthenticated,
      hasAgentConfig: !!agentConfig,
      agentLoading,
      subscriptionLoading,
    });

    // Solo proceder si está autenticado y la carga de datos ha terminado
    if (isAuthenticated && !agentLoading && !subscriptionLoading) {
      const navigateAfterMinimumTime = async () => {
        // Esperar tiempo mínimo de splash (5 segundos)
        const minimumSplashDuration = 5000;
        const elapsedTime = Date.now() - splashStartTime;
        const remainingTime = minimumSplashDuration - elapsedTime;
        
        if (remainingTime > 0) {
          console.log(`⏱️ [SPLASH] Esperando ${remainingTime}ms para completar tiempo mínimo de splash`);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Caso 1: Usuario con agente (agentConfig no es null)
        if (agentConfig) {
          console.log("✅ [INIT] Todos los datos cargados, navegando...");
          console.log("✅ [INIT] isProUser:", isProUser);
          console.log("✅ [INIT] agentId:", agentConfig.id);
          
          // Ocultar splash y navegar
          setShowingSplash(false);
          
          if (!isProUser) {
            console.log("➡️ [NAV] Usuario no-Pro, mostrando PaywallScreen");
            router.replace("/paywall/PaywallScreen" as any);
          } else {
            console.log("➡️ [NAV] Usuario Pro, navegando a home");
            router.replace("/(tabs)/home");
          }
        }
        // Caso 2: Usuario sin agente (nuevo usuario)
        else {
          console.log("✅ [INIT] Usuario sin agente (nuevo usuario), mostrando FirstLoginView");
          // Ocultar splash para mostrar FirstLoginView
          setShowingSplash(false);
        }
      };

      navigateAfterMinimumTime();
    }
  }, [isAuthenticated, agentConfig, agentLoading, subscriptionLoading, isProUser, splashStartTime]);

  // Safety timeout: Si después de 10 segundos no se han cargado los datos,
  // navegar de todas formas para evitar que la app se quede congelada
  useEffect(() => {
    if (!isAuthenticated) return; // Solo aplica si está autenticado

    const safetyTimeout = setTimeout(() => {
      if (showingSplash && (agentLoading || subscriptionLoading)) {
        console.warn("⚠️ [TIMEOUT] Datos tardando demasiado, ocultando splash de todas formas");
        setShowingSplash(false);
        
        // Si hay agentConfig, navegar a home
        // Si no hay agentConfig, FirstLoginView se mostrará automáticamente
        if (agentConfig) {
          router.replace("/(tabs)/home");
        }
      }
    }, 10000); // 10 segundos de timeout

    return () => clearTimeout(safetyTimeout);
  }, [isAuthenticated, showingSplash, agentLoading, subscriptionLoading, agentConfig]);

  // Mostrar splash durante toda la inicialización (updates + auth + data loading)
  if (showingSplash) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.contentColumn}>
          {/* Logo principal DRECOM */}
          <Image
            source={require("@/assets/images/drecom.png")}
            style={styles.mainLogo}
            resizeMode="contain"
          />

          {/* EasyInvoice - Logo + Texto */}
          <View style={styles.productRow}>
            <Image
              source={require("@/assets/images/easyinvoice.png")}
              style={styles.productIcon}
              resizeMode="contain"
            />
            <View style={styles.productTextContainer}>
              <Text style={styles.productName}>{t("splash.easyInvoice")}</Text>
              <Text style={styles.productDescription}>{t("splash.easyInvoiceDesc")}</Text>
            </View>
          </View>

          {/* EasyAgent - Logo + Texto */}
          <View style={styles.productRow}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.productIcon}
              resizeMode="contain"
            />
            <View style={styles.productTextContainer}>
              <Text style={styles.productName}>{t("splash.easyAgent")}</Text>
              <Text style={styles.productDescription}>{t("splash.easyAgentDesc")}</Text>
            </View>
          </View>
        </View>

        {/* Loader y status
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
        <Text style={styles.updateText}>{splashStatus}</Text> */}
      </View>
    );
  }

  // Estos estados ahora se manejan en el splash screen de arriba
  // Si llegamos aquí es porque algo no está configurado correctamente

  // Authenticated but no agent - show first login view
  // Only show FirstLoginView if user is authenticated, loading is done, and has no agent
  if (isAuthenticated && !agentLoading && !subscriptionLoading && !agentConfig) {
    return <FirstLoginView />;
  }

  // Fallback loading (still loading data)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>
        {t("common.loading", "Loading...")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 40,
    paddingBottom: 150,
  },
  contentColumn: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginHorizontal: "auto",
    marginBottom: 50,
  },
  mainLogo: {
    width: 180,
    height: 80,
    marginBottom: 20,
  },
  separator: {
    height: 30,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  productIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: 12,
  },
  productTextContainer: {
    justifyContent: "center",
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loader: {
    marginTop: 30,
  },
  updateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
