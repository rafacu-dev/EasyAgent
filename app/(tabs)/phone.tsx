import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function PhoneScreen() {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [recentCalls, setRecentCalls] = useState<any[]>([]);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, "");
    setPhoneNumber(cleaned);
  };

  const handleMakeCall = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert(
        t("phone.error", "Error"),
        t("phone.invalidNumber", "Please enter a valid phone number")
      );
      return;
    }

    Alert.alert(
      t("phone.confirmCall", "Confirm Call"),
      t("phone.confirmMessage", `Call ${phoneNumber}?`),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("phone.call", "Call"),
          onPress: () => {
            // TODO: Implement actual call functionality
            console.log("Making call to:", phoneNumber);
            Alert.alert(
              t("phone.success", "Success"),
              t("phone.callInitiated", "Call initiated successfully")
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("phone.title", "Phone")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("phone.subtitle", "Make calls with your AI agent")}
          </Text>
        </View>

        <View style={styles.dialerContainer}>
          <Text style={styles.sectionTitle}>{t("phone.enterNumber", "Enter Phone Number")}</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.phoneInput}
              placeholder="+1234567890"
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            {phoneNumber.length > 0 && (
              <TouchableOpacity onPress={() => setPhoneNumber("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.callButton, !phoneNumber && styles.callButtonDisabled]}
            onPress={handleMakeCall}
            disabled={!phoneNumber}
          >
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.callButtonText}>
              {t("phone.makeCall", "Make Call")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentCallsContainer}>
          <Text style={styles.sectionTitle}>{t("phone.recentCalls", "Recent Calls")}</Text>
          
          {recentCalls.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="call-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {t("phone.noRecentCalls", "No recent calls")}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {t("phone.callsWillAppear", "Your call history will appear here")}
              </Text>
            </View>
          ) : (
            recentCalls.map((call, index) => (
              <TouchableOpacity key={index} style={styles.callItem}>
                <View style={styles.callIcon}>
                  <Ionicons 
                    name={call.type === "outgoing" ? "call-outline" : "call"} 
                    size={24} 
                    color="#007AFF" 
                  />
                </View>
                <View style={styles.callDetails}>
                  <Text style={styles.callNumber}>{call.number}</Text>
                  <Text style={styles.callTime}>{call.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              {t("phone.info", "Calls are made using your configured AI agent. Make sure you have sufficient credits.")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: "#666",
  },
  dialerContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: "#1a1a1a",
  },
  callButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  recentCallsContainer: {
    padding: 16,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  callItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  callIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  callDetails: {
    flex: 1,
  },
  callNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  callTime: {
    fontSize: 14,
    color: "#666",
  },
  infoContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1565C0",
    marginLeft: 12,
    lineHeight: 20,
  },
});
