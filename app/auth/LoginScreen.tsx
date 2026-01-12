import React, { useState } from 'react';
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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { PrimaryColor } from '../utils/constants';
import { BaseUrl } from '../utils/constants';

export default function LoginScreen() {
    const router = useRouter();
    const { showLogin } = useLocalSearchParams();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email.trim()) {
            Alert.alert(t('auth.error'), t('auth.emailRequired'));
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert(t('auth.error'), t('auth.invalidEmail'));
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${BaseUrl}/api/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.toLowerCase().trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                // Navegar a la pantalla de verificación
                router.push({
                    pathname: '/auth/VerifyCodeScreen',
                    params: { 
                        email: email.toLowerCase().trim(),
                        isNewUser: data.is_new_user ? 'true' : 'false'
                    }
                });
            } else {
                Alert.alert(t('auth.error'), t('auth.registrationError'));
            }
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert(t('auth.error'), t('auth.networkError'));
        } finally {
            setLoading(false);
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
                        <Image 
                            source={require('../../assets/images/user.png')} 
                            style={styles.userIcon}
                        />
                    </View>

                    <Text style={styles.title}>
                        {showLogin === 'true' ? t('auth.login') : t('auth.createAccount')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {showLogin === 'true' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                    </Text>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('auth.emailPlaceholder')}
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {showLogin === 'true' ? t('auth.login') : t('auth.continue')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => {
                            router.dismissAll()
                            router.replace('/intro/intro');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.linkText}>{t('auth.backToLogin')}</Text>
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
    userIcon: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
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
        marginBottom: 20,
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
    linkButton: {
        alignItems: 'center',
        padding: 10,
    },
    linkText: {
        color: PrimaryColor,
        fontSize: 16,
        fontWeight: '600',
    },
});
