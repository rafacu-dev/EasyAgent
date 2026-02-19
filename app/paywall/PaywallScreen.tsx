import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  Image,
  Animated,
  ImageBackground,
} from "react-native";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesError,
} from "react-native-purchases";
import { useTranslation } from "react-i18next";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
} from "@/app/utils/toast";
import { LEGAL_URLS } from "@/app/utils/constants";

interface PaywallScreenProps {
  onPurchaseSuccess: () => void;
}

const PaywallScreen: React.FC<PaywallScreenProps> = () => {
  const { t } = useTranslation();
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [isProUser, setIsProUser] = useState<boolean>(false);

  const { init, ref, fromIntro } = useLocalSearchParams();

  // Animaciones con react-native-reanimated
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animaciones escalonadas para elementos usando Reanimated
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-20);
  const gradientOpacity = useSharedValue(0);
  const gradientTranslateY = useSharedValue(-20);
  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(-20);
  const packagesOpacity = useSharedValue(0);
  const packagesTranslateY = useSharedValue(-20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(-20);
  const buttonScale = useSharedValue(0.8);
  const termsOpacity = useSharedValue(0);
  const termsTranslateY = useSharedValue(-20);

  // Animación para selección de paquete
  const packageBounceScale = useSharedValue(1);

  const navigation = useNavigation();

  // Verificar si el usuario ya tiene un plan activo
  useEffect(() => {
    const checkActiveSubscription = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasActiveSubscription =
          Object.keys(customerInfo.entitlements.active).length > 0;

        if (hasActiveSubscription) {
          showInfo(
            t("paywall.activePlanTitle"),
            t("paywall.activePlanMessage"),
          );
          setTimeout(() => {
            router.dismissAll();
            router.replace("/home");
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking active subscription:", error);
      }
    };

    checkActiveSubscription();
  }, []);

  // Animación circular continua
  useEffect(() => {
    const startRotation = () => {
      rotateAnim.setValue(0); // Asegurar que inicie desde 0
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 15000, // Aumentado a 15 segundos para rotación más lenta
          useNativeDriver: true,
        }),
        { iterations: -1 }, // -1 significa infinitas iteraciones
      ).start();
    };
    startRotation();

    // Cleanup function para detener la animación cuando el componente se desmonte
    return () => {
      rotateAnim.stopAnimation();
    };
  }, [rotateAnim]);

  // Animaciones escalonadas de entrada con Reanimated
  useEffect(() => {
    const animateElements = () => {
      // Configuración de animación más rápida
      const animationConfig = {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      };

      // Animar elementos en secuencia con delays más rápidos
      titleOpacity.value = withDelay(0, withTiming(1, animationConfig));
      titleTranslateY.value = withDelay(0, withTiming(0, animationConfig));

      gradientOpacity.value = withDelay(80, withTiming(1, animationConfig));
      gradientTranslateY.value = withDelay(80, withTiming(0, animationConfig));

      featuresOpacity.value = withDelay(160, withTiming(1, animationConfig));
      featuresTranslateY.value = withDelay(160, withTiming(0, animationConfig));

      packagesOpacity.value = withDelay(240, withTiming(1, animationConfig));
      packagesTranslateY.value = withDelay(240, withTiming(0, animationConfig));

      buttonOpacity.value = withDelay(320, withTiming(1, animationConfig));
      buttonTranslateY.value = withDelay(320, withTiming(0, animationConfig));
      buttonScale.value = withDelay(
        320,
        withTiming(1, { ...animationConfig, duration: 500 }),
      );

      termsOpacity.value = withDelay(400, withTiming(1, animationConfig));
      termsTranslateY.value = withDelay(400, withTiming(0, animationConfig));
    };

    // Iniciar animaciones más rápidamente
    const timer = setTimeout(animateElements, 100);

    return () => clearTimeout(timer);
  }, []);

  // Estilos animados con useAnimatedStyle
  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    };
  });

  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: gradientOpacity.value,
      transform: [{ translateY: gradientTranslateY.value }],
    };
  });

  const featuresAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: featuresOpacity.value,
      transform: [{ translateY: featuresTranslateY.value }],
    };
  });

  const packagesAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: packagesOpacity.value,
      transform: [{ translateY: packagesTranslateY.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [
        { translateY: buttonTranslateY.value },
        { scale: buttonScale.value },
      ],
    };
  });

  const termsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: termsOpacity.value,
      transform: [{ translateY: termsTranslateY.value }],
    };
  });

  const packageBounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: packageBounceScale.value }],
    };
  });

  // Función para animar la selección de paquete
  const animatePackageSelection = () => {
    packageBounceScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );
  };

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        getOfferings();
      } catch (error) {
        showError(t("paywall.initializationError"), JSON.stringify(error));
        setTimeout(() => onClose(), 2000);
        setLoading(false);
      }
    };

    checkInitialization();
  }, []);

  const getOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);

      const currentOffering = offerings?.current;
      let offeringToUse = currentOffering;
      if (!offeringToUse || offeringToUse.availablePackages.length === 0) {
        const allOfferings = Object.values(offerings?.all || {});
        offeringToUse =
          allOfferings.find(
            (offering) => offering.availablePackages.length > 0,
          ) || null;
      }

      // Seleccionar el primer paquete disponible
      if (offeringToUse && offeringToUse.availablePackages.length > 0) {
        setSelectedPackage(offeringToUse.availablePackages[0]);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const onClose = () => {
    navigation.goBack();
  };
  const onPurchaseSuccess = () => {
    navigation.goBack();
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setPurchasing(true);
      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);

      // Verificar múltiples condiciones para determinar si hay suscripción activa
      const hasActiveSubscription =
        Object.keys(purchaseResult.customerInfo.entitlements.active).length > 0;
      const hasActiveProduct =
        purchaseResult.customerInfo.activeSubscriptions.length > 0;
      const isSubscriptionActive = hasActiveSubscription || hasActiveProduct;
    } catch (error) {
      const purchaseError = error as PurchasesError;
      if (!purchaseError.userCancelled) {
        showError(t("paywall.purchaseError"), purchaseError.message);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active.premium) {
        showSuccess(
          t("paywall.purchasesRestoredTitle"),
          t("paywall.purchasesRestoredMessage"),
        );
        setTimeout(() => {
          onPurchaseSuccess();
          onClose();
        }, 2000);
      } else {
        showInfo(
          t("paywall.noPurchasesFound"),
          t("paywall.noPurchasesMessage"),
        );
      }
    } catch (error) {
      showError(t("paywall.restoreError"));
    }
  };

  const openTermsAndConditions = () => {
    Linking.openURL(LEGAL_URLS.TERMS_OF_SERVICE);
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(LEGAL_URLS.PRIVACY_POLICY);
  };

  // Componente para las imágenes rotatorias
  const RotatingImages = () => {
    const radius = 90; // Radio del círculo - aumentado para más separación
    // Usando todas las 8 imágenes de los toolsButtons del index
    const images = [
      require("@/assets/images/paywall/support.png"),
      require("@/assets/images/paywall/translate.png"),
      require("@/assets/images/paywall/24.png"),
      require("@/assets/images/paywall/callendar.png"),
      require("@/assets/images/paywall/support.png"),
      require("@/assets/images/paywall/translate.png"),
      require("@/assets/images/paywall/24.png"),
      require("@/assets/images/paywall/callendar.png"),
    ];

    return (
      <ImageBackground
        source={require("@/assets/images/bg-icon-suscription.png")}
        style={styles.rotatingContainer}
        resizeMode="cover"
      >
        {/* Líneas de órbita */}
        <View style={styles.orbitLineInner} />
        <View style={styles.orbitLine} />
        <View style={styles.orbitLineOuter} />

        <Animated.View
          style={[
            styles.rotatingImagesContainer,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          {images.map((image, index) => {
            const angle = index * 45 * (Math.PI / 180); // 360/8 = 45 grados entre cada imagen
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <Animated.View
                key={index}
                style={[
                  styles.rotatingImageContainer,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "-360deg"], // Contra-rotación
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                    backgroundColor: "rgba(255, 252, 247, 0.66)",
                    borderRadius: 20,
                  }}
                >
                  <Image source={image} style={styles.rotatingImage} />
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ImageBackground>
    );
  };

  // Función para obtener título y descripción localizados
  const getLocalizedPackageInfo = (
    pkg: PurchasesPackage,
    index: number,
    isReferral: boolean = false,
  ) => {
    const isPopular =
      pkg.identifier.includes("annual") || pkg.identifier.includes("yearly");
    const isMonthly =
      pkg.identifier.includes("monthly") || pkg.identifier.includes("month");

    let title = pkg.product.title;
    let description = pkg.product.description;
    let price = String(pkg.product.price);
    let pricePeriod = "per month";
    let originalPrice = "";
    let discountedPrice = "";

    if (
      !title ||
      title.toLowerCase().includes("annual") ||
      title.toLowerCase().includes("monthly") ||
      title.toLowerCase().includes("premium")
    ) {
      if (isPopular) {
        title = t("paywall.annual");
      } else if (isMonthly) {
        title = t("paywall.monthly");
      } else {
        title = `Plan ${index + 1}`;
      }
    }

    // Si no hay descripción o está en inglés, usar traducciones locales
    if (
      !description ||
      description.toLowerCase().includes("premium") ||
      description.toLowerCase().includes("unlimited") ||
      description.toLowerCase().includes("features")
    ) {
    }

    if (price.includes("3.9")) {
      description = t("paywall.basicMonthlyDescription");
      price = t("paywall.basicMonthlyPrice");
      pricePeriod = t("paywall.perBasicMonthly");
    } else if (isPopular) {
      description = isReferral
        ? t("paywall.annualReferralDescription")
        : t("paywall.annualDescription");
      price = t("paywall.annualPrice");
      pricePeriod = t("paywall.perYear");

      // Calcular descuento para referidos (30% off para plan anual)
      if (isReferral) {
        originalPrice = t("paywall.annualPrice");
        const numericPrice = parseFloat(originalPrice.replace(/[^0-9.]/g, ""));
        const discounted = numericPrice * 0.7; // 30% descuento
        discountedPrice = `$${discounted.toFixed(2)}`;
      }
    } else if (isMonthly) {
      description = isReferral
        ? t("paywall.monthlyReferralDescription")
        : t("paywall.monthlyDescription");
      price = t("paywall.monthlyPrice");
      pricePeriod = t("paywall.perMonth");

      // Calcular descuento para referidos (50% off para plan mensual)
      if (isReferral) {
        originalPrice = t("paywall.monthlyPrice");
        const numericPrice = parseFloat(originalPrice.replace(/[^0-9.]/g, ""));
        const discounted = numericPrice * 0.5; // 50% descuento
        discountedPrice = `$${discounted.toFixed(2)}`;
      }
    } else {
      description = t("paywall.defaultDescription");
      price = t("paywall.defaultPrice");
    }

    return {
      title,
      description,
      price,
      pricePeriod,
      originalPrice,
      discountedPrice,
    };
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>{t("paywall.loadingText")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const description = [
    t("intro.intro0_desc1"),
    t("intro.intro0_desc2"),
    t("intro.intro0_desc3"),
    t("intro.intro0_desc4"),
  ];

  // Obtener offering actual
  const currentOffering = offerings?.current;
  let offeringToUse = currentOffering;
  if (!offeringToUse || offeringToUse.availablePackages.length === 0) {
    const allOfferings = Object.values(offerings?.all || {});
    offeringToUse =
      allOfferings.find((offering) => offering.availablePackages.length > 0) ||
      null;
  }
  const allPackages = offeringToUse?.availablePackages || [];

  //<DetailsPager/>
  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (fromIntro === "true") router.replace("/home");
            else router.back();
          }}
          style={{ alignItems: "center" }}
        >
          <Text style={{ color: "#999999ff", fontSize: 18 }}>
            {t("common.x")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={restorePurchases}
          style={{ alignItems: "center" }}
        >
          <Text style={{ color: "#999999ff", fontSize: 16 }}>
            {t("paywall.restore")}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.fullScreenContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          <View style={{ marginTop: 0, paddingTop: 0 }}>
            <View style={styles.iconContainer}>
              <RotatingImages />
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.centerIcon}
              />
            </View>
            <View style={{ marginTop: -80, backgroundColor: "#fff" }}>
              <Reanimated.View style={titleAnimatedStyle}>
                <Text style={styles.title}>
                  {t("paywall.text1")}{" "}
                  <Text style={[styles.title, { color: Colors.primary }]}>
                    {t("common.pro")}
                  </Text>{" "}
                  {t("paywall.text1_end")}
                </Text>
              </Reanimated.View>

              <Reanimated.View style={gradientAnimatedStyle}>
                <LinearGradient
                  colors={["#FF6B00", "#FF8C00"]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientTextContainer}
                >
                  <Text style={styles.gradientText}>{t("paywall.text2")}</Text>
                </LinearGradient>
              </Reanimated.View>
            </View>
            <Reanimated.View
              style={[
                { marginHorizontal: "auto", marginBottom: 20 },
                featuresAnimatedStyle,
              ]}
            >
              {description.map((desc, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    marginTop: 10,
                    paddingHorizontal: 10,
                    alignItems: "center",
                    maxWidth: "90%",
                  }}
                >
                  {idx === 0 ? (
                    <View
                      style={[
                        styles.iconDetails,
                        { backgroundColor: Colors.primary },
                      ]}
                    >
                      <FontAwesome name="clock-o" size={16} color="white" />
                    </View>
                  ) : idx === 1 ? (
                    <View
                      style={[
                        styles.iconDetails,
                        { backgroundColor: "#2196F3" },
                      ]}
                    >
                      <FontAwesome name="language" size={16} color="white" />
                    </View>
                  ) : idx === 2 ? (
                    <View
                      style={[
                        styles.iconDetails,
                        { backgroundColor: "#4CAF50" },
                      ]}
                    >
                      <FontAwesome name="phone" size={16} color="white" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.iconDetails,
                        { backgroundColor: "#9C27B0" },
                      ]}
                    >
                      <FontAwesome name="calendar" size={16} color="white" />
                    </View>
                  )}
                  <Text style={styles.description}>{desc}</Text>
                </View>
              ))}
            </Reanimated.View>
          </View>

          <View style={styles.packagesContainer}>
            <Reanimated.View style={packagesAnimatedStyle}>
              {allPackages.map((pkg: PurchasesPackage, index: number) => {
                const isPopular =
                  pkg.identifier.includes("annual") ||
                  pkg.identifier.includes("yearly");
                const isSelected =
                  selectedPackage?.identifier === pkg.identifier;
                const isReferral = pkg.identifier
                  .toLowerCase()
                  .includes("referral_code");
                const {
                  title,
                  description,
                  price,
                  pricePeriod,
                  originalPrice,
                  discountedPrice,
                } = getLocalizedPackageInfo(pkg, index, isReferral);

                if (isProUser && price.includes("3.9")) {
                  return null;
                }

                return (
                  <Reanimated.View
                    key={pkg.identifier}
                    style={isSelected ? packageBounceStyle : {}}
                  >
                    <TouchableOpacity
                      style={[
                        styles.packageButton,
                        isSelected && styles.packageButtonSelected,
                      ]}
                      onPress={() => {
                        animatePackageSelection();
                        setSelectedPackage(pkg);
                      }}
                      disabled={purchasing}
                    >
                      {isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>
                            {t("paywall.popularBadge")}
                          </Text>
                        </View>
                      )}

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.packageTitle}>{title}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "300" }}>
                            {description}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          {isReferral && originalPrice && discountedPrice ? (
                            <>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <Text style={styles.originalPrice}>
                                  {originalPrice}
                                </Text>
                                <Text style={styles.discountedPrice}>
                                  {discountedPrice}
                                </Text>
                              </View>
                              <Text
                                style={{
                                  fontWeight: 500,
                                  textAlign: "center",
                                  fontSize: 12,
                                }}
                              >
                                {pricePeriod}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.packagePrice}> {price} </Text>
                              <Text
                                style={{ fontWeight: 500, textAlign: "center" }}
                              >
                                {" "}
                                {pricePeriod}{" "}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Reanimated.View>
                );
              })}
            </Reanimated.View>
          </View>

          {/* Purchase Button */}
          <Reanimated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                purchasing && styles.purchaseButtonDisabled,
              ]}
              disabled={purchasing || !selectedPackage}
              onPress={() => selectedPackage && handlePurchase(selectedPackage)}
            >
              {purchasing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {t("paywall.continue")}
                </Text>
              )}
            </TouchableOpacity>
          </Reanimated.View>

          {/* Terms with embedded links */}
          <Reanimated.View style={[styles.termsContainer, termsAnimatedStyle]}>
            <Text style={styles.termsText}>
              {t("paywall.termsText")}{" "}
              <Text style={styles.linkText} onPress={openTermsAndConditions}>
                {t("paywall.termsOfService")}
              </Text>{" "}
              {t("paywall.and")}{" "}
              <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                {t("paywall.privacyPolicy")}
              </Text>
              {t("paywall.termsTextEnd")}
            </Text>
          </Reanimated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  fullScreenContainer: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: "#000000ff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  packagesContainer: {
    marginBottom: 10,
    flex: 1,
    justifyContent: "center",
  },
  packageButton: {
    borderRadius: 16,
    padding: 20,
    paddingVertical: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d6d6d6ff",
    position: "relative",
  },
  packageButtonSelected: {
    backgroundColor: "#FF8C0020",
    borderColor: "#FF8C00",
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -18,
    alignSelf: "flex-end",
    marginRight: 10,
    backgroundColor: "#FF8C00",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  packageTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF8C00",
    marginBottom: 3,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  packageSavings: {
    fontSize: 14,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  restoreButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  linkText: {
    fontSize: 12,
    color: "#FF8C00",
    textDecorationLine: "underline",
  },
  promoCodeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "center",
    marginBottom: 20,
  },
  promoCodeButtonText: {
    fontSize: 14,
    color: "#FF8C00",
    textAlign: "center",
    opacity: 0.8,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  gradientTextContainer: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignSelf: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradientText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "left",
    marginLeft: 5,
  },
  iconDetails: {
    marginRight: 5,
    width: 25,
    height: 25,
    borderRadius: 50,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 240,
    height: 240,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  rotatingContainer: {
    position: "absolute",
    width: 260,
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  radialBackground: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  orbitLineInner: {
    position: "absolute",
    width: 120, // Radio interior más pequeño
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#ff8c0052",
    opacity: 0.2,
  },
  orbitLine: {
    position: "absolute",
    width: 180, // Radio * 2 = 90 * 2
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "#ff8c0052",
    opacity: 0.3,
  },
  orbitLineOuter: {
    position: "absolute",
    width: 240, // Radio exterior más grande
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#ff8c0052",
    opacity: 0.15,
  },
  rotatingImagesContainer: {
    position: "absolute",
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  rotatingImageContainer: {
    position: "absolute",
  },
  rotatingImage: {
    width: 20,
    height: 20,
  },
  centerIcon: {
    width: 70,
    height: 70,
    borderRadius: 20,
    zIndex: 1,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#d6d6d6ff",
  },
  switchText: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  freeTrialContent: {
    padding: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF5E6",
    borderRadius: 16,
    alignItems: "center",
  },
  freeTrialTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF8C00",
    marginBottom: 10,
    textAlign: "center",
  },
  freeTrialDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  freeTrialPackage: {
    backgroundColor: "#FFF5E6",
    borderColor: "#4CAF50",
  },
  introPriceText: {
    fontSize: 15,
    color: "#4CAF50",
    fontWeight: "900",
  },
  referralCodeBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  referralCodeText: {
    fontSize: 14,
    color: "#FF8C00",
    flex: 1,
    textAlign: "left",
  },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    textDecorationStyle: "solid",
  },
  discountedPrice: {
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default PaywallScreen;
