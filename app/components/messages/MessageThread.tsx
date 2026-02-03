/**
 * MessageThread Component
 *
 * Displays the conversation thread with message input
 */

import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { formatPhoneNumber } from "@/app/utils/formatters";
import type { Conversation, Message } from "@/app/utils/types";
import { MessageBubble } from "./MessageBubble";

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  messageText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  onBack: () => void;
  flatListRef: React.RefObject<FlatList>;
}

export const MessageThread = memo(function MessageThread({
  conversation,
  messages,
  isLoading,
  messageText,
  onChangeText,
  onSend,
  isSending,
  onBack,
  flatListRef,
}: MessageThreadProps) {
  const { t } = useTranslation();

  const displayName =
    conversation.contact_name || formatPhoneNumber(conversation.other_party);

  const renderEmpty = () => (
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
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 50}
    >
      {/* Thread Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayName}
          </Text>
          {conversation.contact_name && (
            <Text style={styles.headerSubtitle}>
              {formatPhoneNumber(conversation.other_party)}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder={t("messages.typeMessage", "Type a message...")}
          placeholderTextColor={Colors.textLight}
          value={messageText}
          onChangeText={onChangeText}
          multiline
          maxLength={1600}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.textWhite} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.textWhite} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
});

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
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  headerInfo: {
    flexDirection: "column",
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingRight: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 60,
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
});

export default MessageThread;
