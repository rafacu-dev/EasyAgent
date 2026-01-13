import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch,
    Modal,
    ActivityIndicator,
} from "react-native";
import { Colors } from "../../utils/colors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useAgent } from "../../utils/AgentContext";
import NoPhoneNumber from "../../components/NoPhoneNumber";
import { apiClient } from "../../utils/axios-interceptor";

export default function PhoneScreen() {
    const { t } = useTranslation();
    const { phoneNumber, agentConfig } = useAgent();
    const [phoneNumberInput, setPhoneNumberInput] = useState("");
    const [isAgentMode, setIsAgentMode] = useState(true); // Toggle between manual/agent call
    const [callPrompt, setCallPrompt] = useState("");
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDigitPress = (digit: string) => {
        setPhoneNumberInput((prev) => prev + digit);
    };

    const handleBackspace = () => {
        setPhoneNumberInput((prev) => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPhoneNumberInput("");
    };

    // No phone number view
    if (!phoneNumber) {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
                        <Text style={styles.headerSubtitle}>
                            {t("phone.subtitle", "Make calls with your AI agent")}
                        </Text>
                    </View>
                    <NoPhoneNumber variant="detailed" translationPrefix="phone" />
                </ScrollView>
            </View>
        );
    }

    const handleMakeCall = async () => {
        if (!phoneNumberInput || phoneNumberInput.length < 10) {
            Alert.alert(
                t("phone.error", "Error"),
                t("phone.invalidNumber", "Please enter a valid phone number")
            );
            return;
        }

        if (isAgentMode && !callPrompt.trim()) {
            Alert.alert(
                t("phone.error", "Error"),
                t("phone.promptRequired", "Please enter instructions for the agent")
            );
            return;
        }

        Alert.alert(
            t("phone.confirmCall", "Confirm Call"),
            t("phone.confirmMessage", `Call ${phoneNumberInput}?`),
            [
                {
                    text: t("common.cancel", "Cancel"),
                    style: "cancel",
                },
                {
                    text: t("phone.call", "Call"),
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            if (isAgentMode) {
                                // AI Agent call
                                const response = await apiClient.post(
                                    "calls/create-phone-call/",
                                    {
                                        agent_id: agentConfig?.id,
                                        from_number: phoneNumber,
                                        to_number: phoneNumberInput,
                                        call_prompt: callPrompt,
                                    }
                                );
                                Alert.alert(
                                    t("phone.success", "Success"),
                                    t(
                                        "phone.agentCallInitiated",
                                        "AI agent call initiated successfully"
                                    )
                                );
                            } else {
                                // Manual call - TODO: Implement Twilio direct call
                                Alert.alert(
                                    t("phone.success", "Success"),
                                    t("phone.callInitiated", "Call initiated successfully")
                                );
                            }
                            setPhoneNumberInput("");
                            setCallPrompt("");
                        } catch (error: any) {
                            Alert.alert(
                                t("phone.error", "Error"),
                                error.response?.data?.error ||
                                    t("phone.callFailed", "Failed to initiate call")
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ flexGrow: 0 }}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
                </View>

                {/* Call Mode Switch */}
                <View style={styles.switchContainer}>
                    <View style={styles.switchLabelRow}>
                        <Text style={styles.switchLabel}>
                            {isAgentMode
                                ? t("phone.agentMode", "AI Agent Call")
                                : t("phone.manualMode", "Direct Call")}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowInfoModal(true)}
                            style={styles.infoButton}
                        >
                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color={Colors.primary}
                            />
                        </TouchableOpacity>
                    </View>
                    <Switch
                        value={isAgentMode}
                        onValueChange={setIsAgentMode}
                        trackColor={{ false: Colors.borderLight, true: Colors.primary }}
                        thumbColor="#fff"
                        style={{
                            width: 40,
                            height: 20,
                            transform: [{ scaleX: 0.9 }, { scaleY: 0.8 }],
                        }}
                    />
                </View>

                {/* Agent Prompt Input (conditional) */}
                {isAgentMode && (
                    <View style={styles.promptContainer}>
                        <Text style={styles.promptLabel}>
                            {t("phone.agentInstructions", "Instructions for AI Agent")}
                        </Text>
                        <TextInput
                            style={styles.promptInput}
                            placeholder={t(
                                "phone.promptPlaceholder",
                                "E.g., Schedule an appointment for next week..."
                            )}
                            placeholderTextColor={Colors.textLight}
                            value={callPrompt}
                            onChangeText={setCallPrompt}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* Phone Number Display */}
                <View style={styles.displayContainer}>
                    {phoneNumberInput.length === 0 && (
                        <Text style={styles.placeholderText}>
                            {t("phone.enterNumber", "Enter Phone Number")}
                        </Text>
                    )}
                    <TextInput
                        style={[styles.displayText, phoneNumberInput.length === 0 && styles.displayTextEmpty]}
                        value={phoneNumberInput}
                        onChangeText={setPhoneNumberInput}
                        placeholder=""
                        placeholderTextColor={Colors.textLight}
                        keyboardType="phone-pad"
                        selectTextOnFocus
                        maxLength={20}
                        autoCorrect={false}
                        autoCapitalize="none"
                        textAlign="center"
                        returnKeyType="done"
                    />
                    {phoneNumberInput.length > 0 && (
                        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={24} color={Colors.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Custom Dial Pad */}
            <View style={styles.dialPad}>
                <View style={styles.dialRow}>
                    {["1", "2", "3"].map((digit) => (
                        <TouchableOpacity
                            key={digit}
                            style={styles.dialButton}
                            onPress={() => handleDigitPress(digit)}
                        >
                            <Text style={styles.dialButtonText}>{digit}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.dialRow}>
                    {["4", "5", "6"].map((digit) => (
                        <TouchableOpacity
                            key={digit}
                            style={styles.dialButton}
                            onPress={() => handleDigitPress(digit)}
                        >
                            <Text style={styles.dialButtonText}>{digit}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.dialRow}>
                    {["7", "8", "9"].map((digit) => (
                        <TouchableOpacity
                            key={digit}
                            style={styles.dialButton}
                            onPress={() => handleDigitPress(digit)}
                        >
                            <Text style={styles.dialButtonText}>{digit}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.dialRow}>
                    <TouchableOpacity
                        style={styles.dialButton}
                        onPress={() => handleDigitPress("*")}
                    >
                        <Text style={styles.dialButtonText}>*</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.dialButton}
                        onPress={() => handleDigitPress("0")}
                    >
                        <Text style={styles.dialButtonText}>0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.dialButton}
                        onPress={() => handleDigitPress("#")}
                    >
                        <Text style={styles.dialButtonText}>#</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.dialRow}>
                    <TouchableOpacity
                        style={styles.dialButton}
                        onPress={() => handleDigitPress("+")}
                    >
                        <Text style={styles.dialButtonText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.dialButton, styles.callButtonDial]}
                        onPress={handleMakeCall}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="call" size={28} color="#fff" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dialButton} onPress={handleBackspace}>
                        <Ionicons
                            name="backspace-outline"
                            size={24}
                            color={Colors.textPrimary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Info Modal */}
            <Modal
                visible={showInfoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInfoModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowInfoModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons
                                name="information-circle"
                                size={32}
                                color={Colors.primary}
                            />
                            <Text style={styles.modalTitle}>
                                {t("phone.infoTitle", "Call Modes")}
                            </Text>
                        </View>
                        <View style={styles.modalBody}>
                            <View style={styles.infoSection}>
                                <Text style={styles.infoSectionTitle}>
                                    {t("phone.agentMode", "AI Agent Call")}
                                </Text>
                                <Text style={styles.infoSectionText}>
                                    {t(
                                        "phone.agentModeInfo",
                                        "Your AI agent will make the call and follow the instructions you provide. Perfect for automated appointment scheduling, customer follow-ups, and more."
                                    )}
                                </Text>
                            </View>
                            <View style={styles.infoSection}>
                                <Text style={styles.infoSectionTitle}>
                                    {t("phone.manualMode", "Direct Call")}
                                </Text>
                                <Text style={styles.infoSectionText}>
                                    {t(
                                        "phone.manualModeInfo",
                                        "Make a direct call where you speak personally using your configured phone number."
                                    )}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowInfoModal(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>
                                {t("buyPhone.modalClose", "Close")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flexGrow: 0,
        flexShrink: 1,
    },
    header: {
        padding: 24,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    switchContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        width: "auto",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 8, // reduced vertical padding
        paddingHorizontal: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,        
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 40, // ensure enough height for the larger switch
    },
    switchLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    infoButton: {
        padding: 4,
    },
    displayContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 15, // reduced vertical padding
        paddingHorizontal: 16,
        minHeight: 40, // reduced min height
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        position: "relative",
    },
    placeholderText: {
        position: "absolute",
        fontSize: 18,
        color: Colors.textLight,
        textAlign: "center",
        pointerEvents: "none",
    },
    displayText: {
        fontSize: 38,
        fontWeight: "600",
        color: Colors.textPrimary,
        letterSpacing: 1,
        flex: 1,
        textAlign: "center",
    },
    displayTextEmpty: {
        color: "transparent",
    },
    clearButton: {
        padding: 4,
    },
    promptContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 8, // reduced vertical padding
        paddingHorizontal: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    promptLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    promptInput: {
        fontSize: 14,
        color: Colors.textPrimary,
        backgroundColor: Colors.backgroundLight,
        borderRadius: 8,
        padding: 12,
        minHeight: 50,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    dialPad: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    dialRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginBottom: 12,
    },
    dialButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dialButtonText: {
        fontSize: 28,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    callButtonDial: {
        backgroundColor: Colors.success,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        width: "85%",
        maxWidth: 400,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.textPrimary,
        flex: 1,
    },
    modalBody: {
        gap: 16,
    },
    infoSection: {
        gap: 8,
    },
    infoSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    infoSectionText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    modalCloseButton: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalCloseButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});
