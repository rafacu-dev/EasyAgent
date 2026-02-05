/**
 * Messages Screen
 *
 * Displays conversations list and message threads
 * Uses useMessages hook for state management and messages components for UI
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";
import { useMessages } from "@/app/hooks/useMessages";
import NoPhoneNumber from "@/app/components/NoPhoneNumber";
import { ConversationList, MessageThread } from "@/app/components/messages";

export default function MessagesScreen() {
  const { t } = useTranslation();

  const {
    // Loading states
    isLoadingAgent,
    isLoadingPhone,
    isLoadingConversations,
    isLoadingMessages,

    // Data
    phoneNumber,
    conversations,
    messages,

    // Selected conversation
    selectedConversation,
    setSelectedConversation,

    // Message input
    messageText,
    setMessageText,

    // Actions
    handleRefresh,
    handleSendMessage,
    refreshing,
    isSending,

    // FlatList ref
    flatListRef,

    // Navigation
    goToCompose,
  } = useMessages();

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
    return (
      <MessageThread
        conversation={selectedConversation}
        messages={messages}
        isLoading={isLoadingMessages}
        messageText={messageText}
        onChangeText={setMessageText}
        onSend={handleSendMessage}
        isSending={isSending}
        onBack={() => setSelectedConversation(null)}
        flatListRef={flatListRef}
      />
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
        <TouchableOpacity onPress={goToCompose} style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {isLoadingConversations ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ConversationList
          conversations={conversations}
          onSelectConversation={setSelectedConversation}
          onNewMessage={goToCompose}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
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
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
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
});
