import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { saveAgentConfig } from '../utils/storage';

export default function AgentSetup() {
    const params = useLocalSearchParams();
    const [agentName, setAgentName] = useState('Alex');
    const [agentGender, setAgentGender] = useState<'male' | 'female'>('male');
    const [agentDescription, setAgentDescription] = useState('');

    const handleSubmit = async () => {
        try {
        await saveAgentConfig({
            templateId: params.templateId as string,
            companyName: params.companyName as string,
            socialMediaAndWeb: params.socialMediaAndWeb as string,
            agentGender: agentGender,
            agentName: agentName,
            agentDescription: agentDescription
        });
        
        // Redirigir directamente al paywall después de configurar el agente
        router.push('/paywall/PaywallScreen' as any);
        } catch (error) {
        Alert.alert(
            'Error',
            String(error),
            [{ text: 'OK' }]
        );
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
            <Text style={styles.title}>Configura tu Agente</Text>
            <Text style={styles.subtitle}>
                Personaliza las características de tu asistente virtual
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
                    Masculino
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
                    Femenino
                    </Text>
                </Pressable>
                </Animated.View>
            </View>
            </View>

            <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre del Agente</Text>
            <TextInput
                style={styles.input}
                placeholder="Ingresa un nombre para tu agente"
                value={agentName}
                onChangeText={setAgentName}
            />
            </View>

            <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción (Opcional)</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe la personalidad o características especiales de tu agente"
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
            style={styles.button}
            onPress={handleSubmit}
            >
            <Text style={styles.buttonText}>Finalizar</Text>
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
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});