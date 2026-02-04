/**
 * useMessages Hook
 *
 * Manages all messages-related state and logic:
 * - Conversations list
 * - Message thread
 * - Sending messages
 * - Deep linking for new conversations
 * - Device contact enrichment for phone numbers
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams, Href } from "expo-router";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useAgentPhoneNumber, useAgentQuery } from "@/app/hooks";
import { showError } from "@/app/utils/toast";
import type { Conversation, Message } from "@/app/utils/types";
import { useContactLookup } from "./useContactLookup";

export interface UseMessagesReturn {
  // Loading states
  isLoadingAgent: boolean;
  isLoadingPhone: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Data
  phoneNumber: string | null;
  conversations: Conversation[];
  messages: Message[];

  // Selected conversation
  selectedConversation: Conversation | null;
  setSelectedConversation: (conv: Conversation | null) => void;

  // Message input
  messageText: string;
  setMessageText: (text: string) => void;

  // Actions
  handleRefresh: () => Promise<void>;
  handleSendMessage: () => void;
  refreshing: boolean;
  isSending: boolean;

  // FlatList ref for scrolling
  flatListRef: React.RefObject<FlatList | null>;

  // Navigation
  goToCompose: () => void;
}

export const useMessages = (): UseMessagesReturn => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Agent and phone number
  const { data: agentConfig, isLoading: isLoadingAgent } = useAgentQuery();
  const { phoneNumber, isLoading: isLoadingPhone } = useAgentPhoneNumber(
    agentConfig?.id,
  );

  // State
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Device contact lookup for enriching phone numbers
  const { getContactName } = useContactLookup();

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiClient.get("messages/conversations/");
      return response;
    },
    enabled: !!phoneNumber,
  });

  // Enrich conversations with device contact names
  const conversations: Conversation[] = useMemo(() => {
    const rawConversations = conversationsData?.data || [];
    return rawConversations.map((conv: Conversation) => ({
      ...conv,
      // Prefer device contact name over backend contact name
      contact_name: getContactName(conv.other_party) ?? conv.contact_name,
    }));
  }, [conversationsData?.data, getContactName]);

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
      return response;
    },
    enabled: !!selectedConversation,
  });

  const messages: Message[] = useMemo(
    () => messagesData?.data || [],
    [messagesData?.data],
  );

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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchConversations();
    setRefreshing(false);
  }, [refetchConversations]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
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

    const toNumber = selectedConversation?.other_party;
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
  }, [messageText, phoneNumber, selectedConversation, sendMessageMutation, t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle new conversation from compose screen
  useEffect(() => {
    const newConversation = params.newConversation as string;
    const initialMessage = params.initialMessage as string;

    if (newConversation && phoneNumber) {
      // Create the conversation first
      const newConv: Conversation = {
        other_party: newConversation,
        contact_name: getContactName(newConversation) ?? null,
        contact_id: null,
        last_message: "",
        last_message_time: new Date().toISOString(),
        unread_count: 0,
        phone_number_id: 0,
        phone_number_display: phoneNumber,
      };

      setSelectedConversation(newConv);

      // If there's an initial message, send it after a small delay
      if (initialMessage && initialMessage.trim()) {
        setTimeout(() => {
          sendMessageMutation.mutate({
            from_number: phoneNumber,
            to_number: newConversation,
            body: initialMessage.trim(),
          });
        }, 100);
      }

      // Clear the params
      router.setParams({
        newConversation: undefined,
        initialMessage: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.newConversation, params.initialMessage, phoneNumber, router]);

  // Navigate to compose
  const goToCompose = useCallback(() => {
    router.push("/compose-message" as Href);
  }, [router]);

  return {
    // Loading states
    isLoadingAgent,
    isLoadingPhone,
    isLoadingConversations,
    isLoadingMessages,

    // Data
    phoneNumber: phoneNumber || null,
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
    isSending: sendMessageMutation.isPending,

    // FlatList ref
    flatListRef,

    // Navigation
    goToCompose,
  };
};

export default useMessages;
