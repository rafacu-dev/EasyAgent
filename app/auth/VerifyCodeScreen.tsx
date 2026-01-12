import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { PrimaryColor, BaseUrl } from '../utils/constants';
import Database from '../database/Database';
import apiClient from '../utils/apiClient';

export default function VerifyCodeScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const email = params.email as string;
    const isNewUser = params.isNewUser === 'true';

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerify = async () => {
        if (!code.trim() || code.length !== 6) {
            Alert.alert(t('auth.error'), t('auth.invalidCode'));
            return;
        }

        setLoading(true);
        try {
            // Obtener company_id de la base de datos
            const companyData = await Database.getCompanyData();
            const companyId = companyData?.id || null;
            
            const response = await fetch(`${BaseUrl}/api/auth/verify-code/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    code: code.trim(),
                    company_id: companyId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar tokens y datos del usuario usando Database
                await Database.setAuthToken(data.tokens.access);
                await Database.setRefreshToken(data.tokens.refresh);
                await Database.setUserEmail(data.user.email);
                await Database.setUserId(data.user.id.toString());

                // Si el backend devolvió companyId, obtener y guardar los datos de la empresa
                if (data.companyId) {
                    try {
                        const companyData = await apiClient.get('/user/companies/');
                        
                        // El endpoint devuelve un array de companies, tomamos la primera
                        const firstCompany = companyData.companies && companyData.companies.length > 0 
                            ? companyData.companies[0] 
                            : null;
                        
                        if (firstCompany) {
                            // Guardar los datos de la empresa en la base de datos local
                            await Database.setCompanyData({
                                id: firstCompany.id,
                                name: firstCompany.name || '',
                                address: firstCompany.address || '',
                                email: firstCompany.email || '',
                                phone: firstCompany.phone || '',
                                logo: firstCompany.business_image || '',
                                signature: firstCompany.signature || '',
                                docNumber: firstCompany.doc_number || ''
                            });
                            
                            console.log('✅ Datos de la empresa guardados en la base de datos local');
                        }
                    } catch (error) {
                        console.error('Error al obtener datos de la empresa:', error);
                        // No mostramos error al usuario, solo registramos en consola
                    }
                }

                // Navegar al home y limpiar historial
                router.dismissAll();
                router.replace('/home');
            } else {
                Alert.alert(t('auth.error'), t('auth.verificationError'));
            }
        } catch (error) {
            console.error('Verification error:', error);
            Alert.alert(t('auth.error'), t('auth.networkError'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        try {
            const response = await fetch(`${BaseUrl}/api/auth/resend-code/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(t('auth.success'), t('auth.codeSent'));
            } else {
                Alert.alert(t('auth.error'), t('auth.resendError'));
            }
        } catch (error) {
            console.error('Resend error:', error);
            Alert.alert(t('auth.error'), t('auth.networkError'));
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="verified-user" size={80} color={PrimaryColor} />
                    </View>

                    <Text style={styles.title}>
                        {isNewUser ? t('auth.verifyEmail') : t('auth.loginTitle')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isNewUser ? t('auth.codeSentTo') : t('auth.loginCodeSentTo')} {email}
                    </Text>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock-outline" size={24} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('auth.codePlaceholder')}
                            placeholderTextColor="#999"
                            value={code}
                            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.verify')}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResendCode}
                        disabled={resending || loading}
                    >
                        {resending ? (
                            <ActivityIndicator color={PrimaryColor} size="small" />
                        ) : (
                            <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.spamNotice}>
                        <MaterialIcons name="info-outline" size={16} color="#999" />
                        <Text style={styles.spamText}>{t('auth.checkSpam')}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => {
                            router.dismissAll() 
                            router.replace('/auth/LoginScreen');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.linkText}>{t('auth.changeEmail')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: PrimaryColor,
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resendButton: {
        alignItems: 'center',
        padding: 10,
        marginBottom: 10,
    },
    resendText: {
        color: PrimaryColor,
        fontSize: 16,
        fontWeight: '600',
    },
    spamNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
        gap: 0,
    },
    spamText: {
        color: '#999',
        fontSize: 13,
        textAlign: 'center',
        flex: 1,
    },
    linkButton: {
        alignItems: 'center',
        padding: 10,
    },
    linkText: {
        color: '#666',
        fontSize: 14,
    },
});
