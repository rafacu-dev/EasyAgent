import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import { saveAgentConfig } from '../utils/storage';
import { BaseUrl } from '../utils/constants';

export default function AgentSetup() {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const [agentName, setAgentName] = useState('Alex');
    const [agentGender, setAgentGender] = useState<'male' | 'female'>('male');
    const [agentDescription, setAgentDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            // Guardar configuración localmente
            await saveAgentConfig({
                templateId: params.templateId as string,
                companyName: params.companyName as string,
                socialMediaAndWeb: params.socialMediaAndWeb as string,
                agentGender: agentGender,
                agentName: agentName,
                agentDescription: agentDescription
            });
            
            // Enviar al API para crear el agente en Retell.ai
            const response = await fetch(`${BaseUrl}/easyagent/retell/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_name: params.companyName as string,
                    social_media_and_web: params.socialMediaAndWeb as string,
                    agent_name: agentName,
                    agent_gender: agentGender,
                    agent_description: agentDescription
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear el agente');
            }
            
            const data = await response.json();
            
            Alert.alert(
                t('common.success'),
                t('agentSetup.agentCreated'),
                [{ 
                    text: 'OK',
                    onPress: () => router.push('/')
                }]
            );
            
        } catch (error) {
            Alert.alert(
                'Error',
                String(error),
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={styles.header}
            >
            <Text style={styles.title}>{t('agentSetup.title')}</Text>
            <Text style={styles.subtitle}>
                {t('agentSetup.subtitle')}
            </Text>
            </Animated.View>

            <Animated.View 
            entering={FadeInUp.delay(400).springify()}
            style={styles.form}
            >
            <View style={styles.inputContainer}>
            <View style={styles.genderContainer}>
                <Animated.View>
                <Pressable
                    style={styles.genderButton}
                    onPress={() => setAgentGender('male')}
                >
                    <View style={[
                    styles.imageContainer,
                    agentGender === 'male' && styles.selectedImageContainer
                    ]}>
                    <Image
                        source={require('../assets/images/agent-m.jpg')}
                        style={styles.genderImage}
                    />
                    </View>
                    <Text style={[
                    styles.genderText,
                    agentGender === 'male' && styles.selectedGenderText
                    ]}>
                    {t('agentSetup.masculine')}
                    </Text>
                </Pressable>
                </Animated.View>

                <Animated.View>
                <Pressable
                    style={styles.genderButton}
                    onPress={() => setAgentGender('female')}
                >
                    <View style={[
                    styles.imageContainer,
                    agentGender === 'female' && styles.selectedImageContainer
                    ]}>
                    <Image
                        source={require('../assets/images/agent-f.jpg')}
                        style={styles.genderImage}
                    />
                    </View>
                    <Text style={[
                    styles.genderText,
                    agentGender === 'female' && styles.selectedGenderText
                    ]}>
                    {t('agentSetup.feminine')}
                    </Text>
                </Pressable>
                </Animated.View>
            </View>
            </View>

            <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('agentSetup.agentName')}</Text>
            <TextInput
                style={styles.input}
                placeholder={t('agentSetup.agentNamePlaceholder')}
                value={agentName}
                onChangeText={setAgentName}
            />
            </View>

            <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('agentSetup.description')} ({t('common.optional')})</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('agentSetup.descriptionPlaceholder')}
                value={agentDescription}
                onChangeText={setAgentDescription}
                multiline
                numberOfLines={4}
            />
            </View>
        </Animated.View>
        </ScrollView>
        
        <Animated.View 
            entering={FadeInUp.delay(600).springify()}
            style={styles.buttonContainer}
        >
            <Pressable 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            >
            <Text style={styles.buttonText}>
                {isLoading ? t('agentSetup.creating') : t('agentSetup.finish')}
            </Text>
            </Pressable>
        </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1a1a1a',
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 10,
    },
    genderButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 150,
        margin: 10,
    },
    imageContainer: {
        padding: 2,
        borderWidth: 3,
        borderColor: 'transparent',
        borderRadius: 68,
        marginBottom: 12,
    },
    selectedImageContainer: {
        borderColor: '#007AFF',
    },
    genderImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    genderText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    selectedGenderText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        paddingVertical: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A0C4FF',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});