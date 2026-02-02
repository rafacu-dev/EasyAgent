/**
 * ConversationList Component
 *
 * Displays list of conversations with pull-to-refresh
 */

import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { formatPhoneNumber } from "@/app/utils/formatters";
import type { Conversation } from "@/app/utils/types";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conv: Conversation) => void;
  onNewMessage: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export const ConversationList = memo(function ConversationList({
  conversations,
  onSelectConversation,
  onNewMessage,
  refreshing,
  onRefresh,
}: ConversationListProps) {
  const { t } = useTranslation();

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onSelectConversation(item)}
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
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>
        {t("messages.noConversations", "No conversations yet")}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t(
          "messages.startMessaging",
          "Tap the compose button to start messaging",
        )}
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onNewMessage}>
        <Text style={styles.emptyButtonText}>
          {t("messages.newMessage", "New Message")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => `${item.other_party}_${item.phone_number_id}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
      contentContainerStyle={
        conversations.length === 0 ? styles.emptyList : undefined
      }
      renderItem={renderConversation}
      ListEmptyComponent={renderEmpty}
    />
  );
});

const styles = StyleSheet.create({
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
});

export default ConversationList;
