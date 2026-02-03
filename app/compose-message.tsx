import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors } from "@/app/utils/colors";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { normalizePhoneNumber } from "@/app/utils/formatters";
import { showError } from "@/app/utils/toast";
import { ContactPicker } from "@/app/components/ContactPicker";
import type { DeviceContact } from "@/app/utils/contactService";

export default function ComposeMessageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [newRecipient, setNewRecipient] = useState("");
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [messageText, setMessageText] = useState("");

  const handleSelectContact = (contact: DeviceContact, phone: string) => {
    setNewRecipient(normalizePhoneNumber(phone));
    setShowContactPicker(false);
  };

  const handleStartNewConversation = () => {
    if (!newRecipient.trim()) {
      showError(
        t("messages.error", "Error"),
        t("messages.enterNumber", "Please enter a phone number"),
      );
      return;
    }

    if (!messageText.trim()) {
      showError(
        t("messages.error", "Error"),
        t("messages.emptyMessage", "Please enter a message"),
      );
      return;
    }

    // Format the number
    let formattedNumber = newRecipient.replace(/[\s\-\(\)]/g, "");
    if (!formattedNumber.startsWith("+")) {
      formattedNumber = "+1" + formattedNumber; // Default to US
    }

    // Navigate back with the selected number and message
    router.push({
      pathname: "/(tabs)/messages",
      params: {
        newConversation: formattedNumber,
        initialMessage: messageText.trim(),
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          presentation: "modal",
          title: t("messages.newMessage", "New Message"),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 30}
      >
        <View style={styles.content}>
          <View style={styles.recipientContainer}>
            <Text style={styles.recipientLabel}>{t("messages.to", "To:")}</Text>
            <TextInput
              style={styles.recipientInput}
              placeholder={t("messages.enterPhoneNumber", "Enter phone number")}
              placeholderTextColor={Colors.textLight}
              value={newRecipient}
              onChangeText={setNewRecipient}
              keyboardType="phone-pad"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => setShowContactPicker(true)}
              style={styles.contactPickerButton}
            >
              <Ionicons
                name="person-add-outline"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder={t("messages.typeMessage", "Type a message...")}
            placeholderTextColor={Colors.textLight}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newRecipient.trim() || !messageText.trim()) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleStartNewConversation}
            disabled={!newRecipient.trim() || !messageText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Contact Picker Modal */}
      <ContactPicker
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelectContact={handleSelectContact}
        title={t("messages.selectContact", "Select Contact")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  recipientContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recipientLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginRight: 12,
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 8,
  },
  contactPickerButton: {
    padding: 8,
  },
  contactPickerList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contactsHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    padding: 16,
    paddingBottom: 8,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactAvatar: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContacts: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  noContactsText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 16,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    maxHeight: 120,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
    shadowOpacity: 0,
  },
});
