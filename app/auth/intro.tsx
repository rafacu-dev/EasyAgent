import React, { useEffect, useRef, useState } from "react";

import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryColor } from "../utils/constants";
import { useTranslation } from "react-i18next";
import * as Haptics from 'expo-haptics';
import LottieView from "lottie-react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { TouchableGradient } from "../components/TouchableGradient";
import CompanyBasicInfo from "./CompanyBasicInfo";
import CompanyContactInfo from "./CompanyContactInfo";
import Constants from 'expo-constants';
import DatabaseTesting from '../database/DatabaseTesting';

// Conditional import for PagerView - only import on native platforms
let PagerView: any = null;
if (Platform.OS !== 'web') {
    PagerView = require("react-native-pager-view").default;
}

const screenWidth = Math.min(Dimensions.get("window").width, 600); 
const screenHeight = Dimensions.get("window").height;

interface IntroProps {
    onFinish: () => void;
}

interface CompanyData {
    companyName: string;
    companyLogo: string | null;
    address: string;
    phone: string;
    email: string;
}

export default function Intro({ onFinish }: IntroProps) {
    const pagerRef = useRef<any>(null);
    const animation = useRef<LottieView>(null);
    const [page, setPage] = useState(0);
    const [currentStep, setCurrentStep] = useState<"intro" | "basic" | "contact">("intro");
    const [companyData, setCompanyData] = useState<Partial<CompanyData>>({});
    const { t } = useTranslation();
    
    // Detectar si la app está corriendo en Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';

    const populateMockData = () => {
        Alert.alert(
            t("intro.populateDataTitle") || "Poblar Datos Ficticios",
            t("intro.populateDataMessage") || "¿Quieres poblar la base de datos con datos ficticios para probar la funcionalidad de backup?",
            [
                {
                    text: t("common.cancel") || "Cancelar",
                    style: "cancel"
                },
                {
                    text: t("intro.populate") || "Poblar",
                    onPress: async () => {
                        try {
                            const success = await DatabaseTesting.populateWithMockData();
                            if (success) {
                                Alert.alert(
                                    t("intro.dataPopulatedTitle") || "✅ Datos Poblados",
                                    t("intro.dataPopulatedMessage") || "Los datos ficticios han sido agregados. Reinicia la app para ver la pantalla de backup.",
                                    [
                                        {
                                            text: t("intro.restartApp") || "Reiniciar App",
                                            onPress: () => {
                                                // Forzar reinicio de la app navegando al root
                                                router.replace('/');
                                            }
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert(t("intro.error") || "Error", t("intro.errorAddingData") || "No se pudieron agregar los datos ficticios");
                            }
                        } catch (error) {
                            Alert.alert(t("intro.error") || "Error", t("intro.errorPopulatingData") || "Ocurrió un error al poblar los datos");
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    const sliderData = [
        {
            title: t("intro.intro1_title"),
            description: [
                t("intro.intro1_desc1"),
                t("intro.intro1_desc2"),
                t("intro.intro1_desc3"),
            ],
            image: require("../../assets/lotties/intro1.json"),
        },
        {
            title: t("intro.intro2_title"),
            description: [
                t("intro.intro2_desc1"),
                t("intro.intro2_desc2"),
                t("intro.intro2_desc3"),
            ],
            image: require("../../assets/lotties/intro2.json"),
        },
        {
            title: t("intro.intro3_title"),
            description: [
                t("intro.intro3_desc1"),
                t("intro.intro3_desc2"),
                t("intro.intro3_desc3"),
            ],
            image: require("../../assets/lotties/intro3.json"),
        },
    ];
    
    const navigation = useNavigation();
    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);


    const renderPage = (item: typeof sliderData[0], index: number) => (
        <View key={index} style={styles.slide}>
            <ScrollView 
                horizontal={false} // Asegura que el scroll sea solo vertical
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ flexGrow: 0, padding: 40, width: screenWidth }}
            >    
                <View style={{}}>
                    <Text style={styles.title}>{item.title}</Text>
                    <LottieView
                        loop={false}
                        autoPlay
                        ref={animation}
                        style={styles.icon}
                        source={item.image}
                    />
                    <View style={{}}>
                    {
                        item.description.map((desc, idx) => (
                            <View key={idx} style={{ flexDirection: "row", marginTop: 20, }}>
                                <FontAwesome name="check-circle" size={18} color={PrimaryColor} style={{marginRight:2}} />
                                <Text style={styles.description}>{desc}</Text>
                            </View>
                        ))
                    }
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    const handleStartPress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        // Navigate to login with showLogin parameter
        router.push("/auth/LoginScreen?showLogin=true");
    };

    const handleSignUpPress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        // Navigate to company info for sign up
        setCurrentStep("basic");
    };

    const handleBasicInfoNext = (data: { companyName: string; companyLogo: string | null }) => {
        setCompanyData((prev) => ({ ...prev, ...data }));
        setCurrentStep("contact");
    };

    const handleBasicInfoBack = () => {
        setCurrentStep("intro");
    };

    const handleContactInfoNext = (data: {
        address: string;
        phone: string;
        email: string;
    }) => {
        const finalData: CompanyData = {
            companyName: companyData.companyName || "",
            companyLogo: companyData.companyLogo || null,
            address: data.address,
            phone: data.phone,
            email: data.email,
        };
        
        // TODO: Save company data to database
        console.log("Company data:", finalData);
        
        // Now finish and go to paywall/subscription
        onFinish();
    };

    const handleContactInfoBack = () => {
        setCurrentStep("basic");
    };

    const handleNextPage = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        if (page < sliderData.length - 1) {
            const nextPage = page + 1;
            setPage(nextPage);
            if (Platform.OS !== 'web' && pagerRef.current) {
                pagerRef.current.setPage(nextPage);
            }
        }
    };

    const handlePrevPage = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        if (page > 0) {
            const prevPage = page - 1;
            setPage(prevPage);
            if (Platform.OS !== 'web' && pagerRef.current) {
                pagerRef.current.setPage(prevPage);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {currentStep === "intro" && (
                <>
                    {Platform.OS === 'web' ? (
                        // Web version - simple View with conditional rendering
                        <View style={styles.pagerView}>
                            {renderPage(sliderData[page], page)}
                        </View>
                    ) : (
                        // Native version - PagerView
                        PagerView && (
                            <PagerView 
                                ref={pagerRef} 
                                style={styles.pagerView} 
                                initialPage={0} 
                                scrollEnabled={true} 
                                onPageSelected={e => setPage(e.nativeEvent.position)}
                            >
                                {sliderData.map((item, index) => renderPage(item, index))}
                            </PagerView>
                        )
                    )}
                    
                    {/* Navigation Arrows */}
                    <View style={styles.navigationContainer}>                
                        {/* Page Indicator */}
                        <View style={styles.indicatorContainer}>
                            {sliderData.map((_, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            if (pagerRef.current) {
                                                pagerRef.current.setPage(index);
                                            }
                                        } else {
                                            setPage(index);
                                        }
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.indicator,
                                            page === index && styles.activeIndicator
                                        ]}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleStartPress}>
                        <Text style={styles.loginButtonText}>{t("intro.login") || "Iniciar Sesión"}</Text>
                    </TouchableOpacity>

                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>
                            {t("intro.noAccount") || "¿Aún no tienes una cuenta?"}{" "}
                        </Text>
                        <TouchableOpacity onPress={handleSignUpPress}>
                            <Text style={styles.signUpLink}>
                                {t("intro.createAccount") || "Crear cuenta"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Botón para desarrollo - Solo visible en Expo Go */}
                    {isExpoGo && (
                        <TouchableOpacity 
                            style={styles.testDataButton} 
                            onPress={populateMockData}
                        >
                            <Ionicons name="flask-outline" size={16} color={"#666"} />
                            <Text style={styles.testDataButtonText}>{t("intro.addTestingData") || "Agregar Datos de Testing"}</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {currentStep === "basic" && (
                <CompanyBasicInfo />
            )}

            {currentStep === "contact" && (
                <CompanyContactInfo />
            )}
        </SafeAreaView>
    );  
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    pagerView: {
        flex: 1,
        width: screenWidth,
    },
    slide: {
        alignItems: "center",
    },
    box: {
        width: screenWidth,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    icon: {
        width: screenWidth*0.8,
        aspectRatio: 1,
        alignSelf: "center",
        resizeMode: "contain",
    },
    description: {
        fontSize: 16,
        textAlign: "left",
        marginLeft: 5,
    },
    navigationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: screenWidth * 0.9,
        alignSelf: "center",
        marginVertical: 15,
    },
    navButton: {
        padding: 10,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#D3D3D3",
        marginHorizontal: 4,
    },
    activeIndicator: {
        backgroundColor: PrimaryColor,
        width: 24,
    },
    loginButton: {
        backgroundColor: PrimaryColor,
        marginBottom: 15,
        padding: 15,
        borderRadius: 30,
        marginTop: 10,
        alignSelf: "center",
        width: screenWidth * 0.9,
        justifyContent: "center",
        alignItems: "center",
    },
    loginButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    signUpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    signUpText: {
        fontSize: 14,
        color: "#666",
    },
    signUpLink: {
        fontSize: 14,
        color: PrimaryColor,
        fontWeight: "600",
    },
    testDataButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 5,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        alignSelf: 'center',
    },
    testDataButtonText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    nextButton: {
        backgroundColor: PrimaryColor,
        marginBottom:10,
        padding: 15,
        borderRadius: 30,
        marginTop: 10,
        alignSelf: "center",
        width: screenWidth * 0.9,
        justifyContent: "center",
        alignItems: "center",
    },
    nextButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
