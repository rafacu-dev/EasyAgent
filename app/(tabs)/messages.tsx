import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAgentPhoneNumber, useAgentQuery } from "@/app/utils/hooks";
import type { Conversation, Message, Contact } from "@/app/utils/types";
import { formatPhoneNumber } from "@/app/utils/formatters";
import { showError } from "@/app/utils/toast";
import NoPhoneNumber from "../components/NoPhoneNumber";

export default function MessagesScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: agentConfig, isLoading: isLoadingAgent } = useAgentQuery();
  const { phoneNumber, isLoading: isLoadingPhone } = useAgentPhoneNumber(
    agentConfig?.id,
  );

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [messageText, setMessageText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiClient.get("messages/conversations/");
      return response.data;
    },
    enabled: !!phoneNumber,
  });

  const conversations: Conversation[] = conversationsData?.data || [];

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messages-thread", selectedConversation?.other_party],
    queryFn: async () => {
      const response = await apiClient.get(
        `messages/thread/?other_party=${encodeURIComponent(
          selectedConversation!.other_party,
        )}`,
      );
      return response.data;
    },
    enabled: !!selectedConversation,
  });

  const messages: Message[] = messagesData?.data || [];

  // Fetch contacts for picker
  const { data: contactsData } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const response = await apiClient.get("contacts/");
      return response.data;
    },
  });

  const contacts: Contact[] = contactsData?.data || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      from_number: string;
      to_number: string;
      body: string;
    }) => {
      const response = await apiClient.post("messages/send/", data);
      return response.data;
    },
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      refetchConversations();
      queryClient.invalidateQueries({ queryKey: ["messages-thread"] });
    },
    onError: (error: any) => {
      showError(
        t("messages.error", "Error"),
        error.response?.data?.error ||
          t("messages.sendFailed", "Failed to send message"),
      );
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchConversations();
    setRefreshing(false);
  }, [refetchConversations]);

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      showError(
        t("messages.error", "Error"),
        t("messages.emptyMessage", "Please enter a message"),
      );
      return;
    }

    if (!phoneNumber) {
      showError(
        t("messages.error", "Error"),
        t("messages.noPhoneNumber", "No phone number available"),
      );
      return;
    }

    const toNumber = selectedConversation?.other_party || newRecipient;
    if (!toNumber) {
      showError(
        t("messages.error", "Error"),
        t("messages.noRecipient", "Please select a recipient"),
      );
      return;
    }

    sendMessageMutation.mutate({
      from_number: phoneNumber,
      to_number: toNumber,
      body: messageText.trim(),
    });
  };

  const handleStartNewConversation = () => {
    if (!newRecipient.trim()) {
      showError(
        t("messages.error", "Error"),
        t("messages.enterNumber", "Please enter a phone number"),
      );
      return;
    }

    // Format the number
    let formattedNumber = newRecipient.replace(/[\s\-\(\)]/g, "");
    if (!formattedNumber.startsWith("+")) {
      formattedNumber = "+1" + formattedNumber; // Default to US
    }

    setSelectedConversation({
      other_party: formattedNumber,
      contact_name: null,
      contact_id: null,
      last_message: "",
      last_message_time: new Date().toISOString(),
      unread_count: 0,
      phone_number_id: 0,
      phone_number_display: phoneNumber || "",
    });
    setShowNewMessageModal(false);
    setNewRecipient("");
  };

  const handleSelectContact = (contact: Contact) => {
    setNewRecipient(contact.phone_number);
    setShowContactPicker(false);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Loading state
  if (isLoadingAgent || isLoadingPhone) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("messages.title", "Messages")}
          </Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {t("messages.loading", "Loading...")}
          </Text>
        </View>
      </View>
    );
  }

  // No phone number
  if (!phoneNumber) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("messages.title", "Messages")}
          </Text>
        </View>
        <NoPhoneNumber />
      </View>
    );
  }

  // Conversation thread view
  if (selectedConversation) {
    const displayName =
      selectedConversation.contact_name ||
      formatPhoneNumber(selectedConversation.other_party);

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        {/* Thread Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedConversation(null)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {displayName}
            </Text>
            {selectedConversation.contact_name && (
              <Text style={styles.headerSubtitle}>
                {formatPhoneNumber(selectedConversation.other_party)}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons
              name="call-outline"
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {isLoadingMessages ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.direction === "outbound"
                    ? styles.outboundMessage
                    : styles.inboundMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.direction === "outbound"
                      ? styles.outboundText
                      : styles.inboundText,
                  ]}
                >
                  {item.body}
                </Text>
                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.messageTime,
                      item.direction === "outbound"
                        ? styles.outboundTime
                        : styles.inboundTime,
                    ]}
                  >
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {item.direction === "outbound" && (
                    <Ionicons
                      name={
                        item.status === "delivered"
                          ? "checkmark-done"
                          : item.status === "sent"
                            ? "checkmark"
                            : item.status === "failed"
                              ? "close"
                              : "time-outline"
                      }
                      size={14}
                      color={
                        item.status === "failed"
                          ? Colors.error
                          : Colors.textWhite
                      }
                      style={styles.statusIcon}
                    />
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={48}
                  color={Colors.textLight}
                />
                <Text style={styles.emptyText}>
                  {t("messages.noMessages", "No messages yet")}
                </Text>
                <Text style={styles.emptySubtext}>
                  {t("messages.startConversation", "Send a message to start")}
                </Text>
              </View>
            }
          />
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder={t("messages.typeMessage", "Type a message...")}
            placeholderTextColor={Colors.textLight}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1600}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.textWhite} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.textWhite} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Conversations List view
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("messages.title", "Messages")}
        </Text>
        <TouchableOpacity
          onPress={() => setShowNewMessageModal(true)}
          style={styles.newMessageButton}
        >
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {isLoadingConversations ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => `${item.other_party}_${item.phone_number_id}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyList : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => setSelectedConversation(item)}
            >
              <View style={styles.avatarContainer}>
                <Ionicons
                  name="person-circle-outline"
                  size={50}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName} numberOfLines={1}>
                    {item.contact_name || formatPhoneNumber(item.other_party)}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {new Date(item.last_message_time).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message}
                </Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={Colors.textLight}
              />
              <Text style={styles.emptyTitle}>
                {t("messages.noConversations", "No conversations yet")}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t(
                  "messages.startMessaging",
                  "Tap the compose button to start messaging",
                )}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowNewMessageModal(true)}
              >
                <Text style={styles.emptyButtonText}>
                  {t("messages.newMessage", "New Message")}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* New Message Modal */}
      <Modal
        visible={showNewMessageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("messages.newMessage", "New Message")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNewMessageModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.recipientContainer}>
              <Text style={styles.recipientLabel}>
                {t("messages.to", "To:")}
              </Text>
              <TextInput
                style={styles.recipientInput}
                placeholder={t(
                  "messages.enterPhoneNumber",
                  "Enter phone number",
                )}
                placeholderTextColor={Colors.textLight}
                value={newRecipient}
                onChangeText={setNewRecipient}
                keyboardType="phone-pad"
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

            {showContactPicker && (
              <View style={styles.contactPickerList}>
                <FlatList
                  data={contacts}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.contactsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.contactItem}
                      onPress={() => handleSelectContact(item)}
                    >
                      <Ionicons
                        name="person-circle-outline"
                        size={40}
                        color={Colors.primary}
                      />
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{item.name}</Text>
                        <Text style={styles.contactNumber}>
                          {formatPhoneNumber(item.phone_number)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.noContactsText}>
                      {t("messages.noContacts", "No contacts available")}
                    </Text>
                  }
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartNewConversation}
            >
              <Text style={styles.startButtonText}>
                {t("messages.startConversation", "Start Conversation")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerAction: {
    padding: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  newMessageButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  outboundMessage: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  inboundMessage: {
    backgroundColor: Colors.cardBackground,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  outboundText: {
    color: Colors.textWhite,
  },
  inboundText: {
    color: Colors.textPrimary,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  outboundTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  inboundTime: {
    color: Colors.textLight,
  },
  statusIcon: {
    marginLeft: 4,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: 32,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 16,
    maxHeight: 100,
    color: Colors.textPrimary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  modalClose: {
    padding: 4,
  },
  recipientContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recipientLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  recipientInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  contactPickerButton: {
    padding: 10,
    marginLeft: 8,
  },
  contactPickerList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  contactsList: {
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  contactNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noContactsText: {
    padding: 16,
    textAlign: "center",
    color: Colors.textSecondary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  startButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});
