import { useNavigation } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import Purchases, { PurchasesOfferings, PurchasesPackage, PurchasesError } from 'react-native-purchases';
import { useTranslation } from 'react-i18next';


interface PaywallScreenProps {
  onPurchaseSuccess: () => void;
}


const PaywallScreen: React.FC<PaywallScreenProps> = () => {
    const { t } = useTranslation();
    const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);



    useEffect(() => {
        const checkInitialization = async () => {
            try {
                getOfferings();
            } catch (error) {
                Alert.alert(
                    'Initialization Error', 
                    JSON.stringify(error),
                    [
                        { text: 'OK', onPress: () => onClose() }
                    ]
                );
                setLoading(false);
            }
        };

        checkInitialization();
    }, []);

    const getOfferings = async () => {
        try {        
            const offerings = await Purchases.getOfferings(); 
            console.log("Offerings fetched:", offerings); 
            setOfferings(offerings);
            
            const currentOffering = offerings?.current;
            let offeringToUse = currentOffering;
            if (!offeringToUse || offeringToUse.availablePackages.length === 0) {
                const allOfferings = Object.values(offerings?.all || {});
                offeringToUse = allOfferings.find(offering => offering.availablePackages.length > 0) || null;
            }
            
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

            const hasActiveSubscription = Object.keys(purchaseResult.customerInfo.entitlements.active).length > 0;
            
            if (hasActiveSubscription) {
                Alert.alert(
                t('paywall.purchaseSuccessTitle'),
                t('paywall.purchaseSuccessMessage'),
                [
                    {
                    text: t('paywall.ok'),
                    onPress: () => {
                        onClose();
                    }
                    }
                ]
                );
            }
        } catch (error) {
            const purchaseError = error as PurchasesError;
            if (!purchaseError.userCancelled) {
                Alert.alert(t('paywall.purchaseError'), purchaseError.message);
            }
        } finally {
        setPurchasing(false);
        }
    };

    const restorePurchases = async () => {
        try {
        const customerInfo = await Purchases.restorePurchases();
        if (customerInfo.entitlements.active.premium) {
            Alert.alert(
            t('paywall.purchasesRestoredTitle'),
            t('paywall.purchasesRestoredMessage'),
            [
                {
                text: t('paywall.ok'),
                onPress: () => {
                    onPurchaseSuccess();
                    onClose();
                }
                }
            ]
            );
        } else {
            Alert.alert(t('paywall.noPurchasesFound'), t('paywall.noPurchasesMessage'));
        }
        } catch (error) {
            Alert.alert(t('paywall.restoreError'));
        }
    };

    const openTermsAndConditions = () => {
        Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
    };

    const openPrivacyPolicy = () => {
        Linking.openURL('https://rafacu-dev.github.io/remote-config/easy-invoice/');
    };

    const navigation = useNavigation();
    
    // Función para obtener título y descripción localizados
    const getLocalizedPackageInfo = (pkg: PurchasesPackage, index: number) => {
        const isPopular = pkg.identifier.includes('annual') || pkg.identifier.includes('yearly');
        const isMonthly = pkg.identifier.includes('monthly') || pkg.identifier.includes('month');
        
        let title = pkg.product.title;
        let description = pkg.product.description;
        let price = String(pkg.product.price);
        let pricePeriod = "per month";

        if (!title || title.toLowerCase().includes('annual') || title.toLowerCase().includes('monthly') || title.toLowerCase().includes('premium')) {
            if (isPopular) {
                title = t('paywall.annual');
            } else if (isMonthly) {
                title = t('paywall.monthly');
            } else {
                title = `Plan ${index + 1}`;
            }
        }
        
        // Si no hay descripción o está en inglés, usar traducciones locales
        if (!description || description.toLowerCase().includes('premium') || description.toLowerCase().includes('unlimited') || description.toLowerCase().includes('features')) {
            
        }
        
        if( price.includes("3.9")){
            description = t('paywall.basicMonthlyDescription');
            price = t('paywall.basicMonthlyPrice');
            pricePeriod = t('paywall.perBasicMonthly');
        }
        else if (isPopular) {
            description = t('paywall.annualDescription');
            price = t('paywall.annualPrice');
            pricePeriod = t('paywall.perYear');
        } else if (isMonthly ) {
            description = t('paywall.monthlyDescription');
            price = t('paywall.monthlyPrice');
            pricePeriod = t('paywall.perMonth');
        } else {
            description = t('paywall.defaultDescription');
            price = t('paywall.defaultPrice');
        }
        
        return { title, description, price, pricePeriod };
    };

    

    useEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
            <View style={{ flex:1, flexDirection:"row", alignItems: "center", justifyContent: "flex-end" }}>
                <TouchableOpacity onPress={restorePurchases} style={{alignItems: 'center'}}>
                    <Text style={{ color: '#999999ff', fontSize: 16 }}>{t('paywall.restore')}</Text>
                </TouchableOpacity>
            </View>
            ),
            headerShown: true,
        });
    }, [navigation, restorePurchases, t]);

    if (loading) {
        return (
        <SafeAreaView style={styles.container}>
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>{t('paywall.loadingText')}</Text>
            </View>
        </SafeAreaView>
        );
    }

    const currentOffering = offerings?.current;    
    // Si no hay offering actual o no hay paquetes, intentar usar la primera offering disponible
    let offeringToUse = currentOffering;
    if (!offeringToUse || offeringToUse.availablePackages.length === 0) {
        const allOfferings = Object.values(offerings?.all || {});
        offeringToUse = allOfferings.find(offering => offering.availablePackages.length > 0) || null;
    }
    
    if (!offeringToUse || offeringToUse.availablePackages.length === 0) {
        return (
        <SafeAreaView style={styles.container}>
            <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{t('paywall.noSubscriptionsText')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{t('paywall.close')}</Text>
            </TouchableOpacity>
            </View>
        </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.packagesContainer}>
                {offeringToUse.availablePackages
                    .map((pkg: PurchasesPackage, index: number) => {
                    const isPopular = pkg.identifier.includes('annual') || pkg.identifier.includes('yearly');
                    const isSelected = selectedPackage?.identifier === pkg.identifier;
                    const { title, description, price, pricePeriod } = getLocalizedPackageInfo(pkg, index);
                
                    if (price.includes("3.9")) {
                        return <></>;
                    }
                    
                    return (
                        <TouchableOpacity
                        key={pkg.identifier}
                        style={[
                            styles.packageButton,
                            isSelected && styles.packageButtonSelected
                        ]}
                        onPress={() => {
                            setSelectedPackage(pkg)
                            if( price.includes("3.9")){
                                Alert.alert(
                                    t('paywall.basicMonthlyTitle')
                                );
                            }
                        }}
                        disabled={purchasing}
                        >
                            {isPopular && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularBadgeText}>{t('paywall.popularBadge')}</Text>
                                </View>
                            )}
                            
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.packageTitle}>
                                        {title}
                                    </Text>
                                    <Text style={{fontWeight: 300}}>
                                        {description}
                                    </Text>
                                </View>
                            
                                <View style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                                    <Text style={styles.packagePrice}> {price} </Text>
                                    <Text style={{fontWeight: 500,textAlign: 'center'}}> {pricePeriod} </Text>
                                </View>
                            </View>
                            
                        </TouchableOpacity>
                    );
                })}
                </View>

                {/* Purchase Button */}
                <TouchableOpacity
                style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
                disabled={purchasing || !selectedPackage}
                onPress={() => selectedPackage && handlePurchase(selectedPackage)}
                >
                {purchasing ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.purchaseButtonText}>
                    {t('paywall.continue')}
                    </Text>
                )}
                </TouchableOpacity>


                {/* Terms with embedded links */}
                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                        {t('paywall.termsText')}
                        {' '}
                        <Text 
                            style={styles.linkText} 
                            onPress={openTermsAndConditions}
                        >
                            {t('paywall.termsOfService')}
                        </Text>
                        {' '}
                        {t('paywall.and')}
                        {' '}
                        <Text 
                            style={styles.linkText} 
                            onPress={openPrivacyPolicy}
                        >
                            {t('paywall.privacyPolicy')}
                        </Text>
                        {t('paywall.termsTextEnd')}
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
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
    color: '#fff',
    textAlign: 'center',
  },
  packagesContainer: {
    marginBottom: 10,
  },
  packageButton: {
    borderRadius: 16,
    padding: 20,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d6d6d6ff',
    position: 'relative',
  },
  packageButtonSelected: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -15,
    alignSelf: 'flex-end',
    marginRight: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 3,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  packageSavings: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  promoCodeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 20,
  },
  promoCodeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default PaywallScreen;