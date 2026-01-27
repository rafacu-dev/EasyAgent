import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  formatDuration,
  formatDateTime,
  formatPhoneNumber,
} from "@/app/utils/formatters";
import { showError, showSuccess } from "@/app/utils/toast";
import type { Contact } from "@/app/utils/types";

interface CallDetails {
  id: string;
  from_number?: string;
  to_number?: string;
  duration_ms?: number;
  start_timestamp?: number; // ms
  end_timestamp?: number; // ms
  call_status?: "completed" | "missed" | "error" | "in_progress" | string;
  disconnect_reason?: string;
  direction?: "inbound" | "outbound" | string;
  call_type?: string;
  transcript?: string;
  recording_url?: string;
  call_analysis?: Record<string, any> | [string, any][];
  agent_name?: string;
}

interface AgentInfo {
  name?: string;
}

export default function CallDetailsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  // Contact modal state
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");

  // Audio player state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const { data, isLoading } = useQuery<
    CallDetails | { call?: CallDetails; agent?: AgentInfo } | undefined
  >({
    queryKey: ["callDetails", id],
    queryFn: async ({ queryKey }) => {
      const res = await apiClient.get(`calls/${queryKey[1]}/`);
      return res;
    },
    enabled: !!id,
  });

  // Extract phone numbers from call data
  const rawCall: CallDetails | undefined =
    (data && (data as any).call) || (data as CallDetails) || undefined;
  const otherPartyNumber =
    rawCall?.direction === "inbound"
      ? rawCall?.from_number
      : rawCall?.to_number;

  // Contact lookup query
  const { data: contactLookupData, refetch: refetchContact } = useQuery<{
    data: Contact | null;
    found: boolean;
  }>({
    queryKey: ["contact-lookup", otherPartyNumber],
    queryFn: async () => {
      const response = await apiClient.get(
        `contacts/lookup/?phone_number=${encodeURIComponent(otherPartyNumber!)}`,
      );
      return response.data;
    },
    enabled: !!otherPartyNumber,
  });

  const existingContact = contactLookupData?.found
    ? contactLookupData.data
    : null;

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: {
      name: string;
      phone_number: string;
      notes: string;
    }) => {
      const response = await apiClient.post("contacts/", contactData);
      return response.data;
    },
    onSuccess: () => {
      showSuccess(
        t("callDetails.contactAdded", "Contact Added"),
        t("callDetails.contactAddedMessage", "Contact has been saved"),
      );
      setShowAddContactModal(false);
      setContactName("");
      setContactNotes("");
      queryClient.invalidateQueries({ queryKey: ["contact-lookup"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      refetchContact();
    },
    onError: (error: any) => {
      showError(
        t("callDetails.error", "Error"),
        error.response?.data?.error ||
          t("callDetails.contactAddFailed", "Failed to add contact"),
      );
    },
  });

  const handleAddContact = () => {
    if (!contactName.trim()) {
      showError(
        t("callDetails.error", "Error"),
        t("callDetails.nameRequired", "Please enter a name"),
      );
      return;
    }

    addContactMutation.mutate({
      name: contactName.trim(),
      phone_number: selectedPhoneNumber,
      notes: contactNotes.trim(),
    });
  };

  const openAddContactModal = (phoneNumber: string) => {
    setSelectedPhoneNumber(phoneNumber);
    setContactName("");
    setContactNotes("");
    setShowAddContactModal(true);
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  const handlePlayRecording = async (recordingUrl: string) => {
    try {
      if (sound) {
        // If sound exists, toggle play/pause
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        return;
      }

      // Load and play new sound
      setIsLoadingAudio(true);

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate,
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing recording:", error);
      showError(
        t("callDetails.playbackError", "Playback Error"),
        t(
          "callDetails.playbackErrorMessage",
          "Failed to play recording. Please try again.",
        ),
      );
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopRecording = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    }
  };

  const formatPlaybackTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const displayCall: CallDetails = rawCall ?? {
    id: String(id ?? "unknown"),
    call_status: "unknown",
  };
  const displayAgent: AgentInfo = (data && (data as any).agent) || {
      name: rawCall?.agent_name,
    } || { name: "Unknown" };

  const toObj = (analysis?: CallDetails["call_analysis"]) => {
    if (!analysis) return {} as Record<string, any>;
    if (Array.isArray(analysis)) {
      const o: Record<string, any> = {};
      analysis.forEach(([k, v]) => {
        o[k] = v;
      });
      return o;
    }
    return analysis as Record<string, any>;
  };

  const callAnalysis = toObj(displayCall.call_analysis);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "in_progress":
        return Colors.info;
      case "missed":
        return Colors.statusMissed;
      case "error":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getDirectionInfo = (direction?: string) => {
    switch (direction) {
      case "inbound":
        return { icon: "arrow-down-circle" as const, color: Colors.success };
      case "outbound":
        return { icon: "arrow-up-circle" as const, color: Colors.info };
      default:
        return { icon: "help-circle" as const, color: Colors.textSecondary };
    }
  };

  const estimateCost = (ms?: number) => {
    if (!ms || ms <= 0) return "$0.00";
    const minutes = Math.ceil(ms / 60000);
    const cost = minutes * 0.06; // simple estimate
    return `$${cost.toFixed(2)}`;
  };

  const directionInfo = getDirectionInfo(displayCall.direction);

  // Parse transcript into chat messages
  const parseTranscript = (transcript?: string) => {
    if (!transcript) return [];

    const messages: { role: "agent" | "client"; text: string }[] = [];
    const lines = transcript.split("\n");

    let currentRole: "agent" | "client" | null = null;
    let currentText = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if line starts with role indicator
      if (
        trimmed.toLowerCase().startsWith("agent:") ||
        trimmed.toLowerCase().startsWith("assistant:")
      ) {
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        currentRole = "agent";
        currentText = trimmed.substring(trimmed.indexOf(":") + 1).trim();
      } else if (
        trimmed.toLowerCase().startsWith("client:") ||
        trimmed.toLowerCase().startsWith("user:") ||
        trimmed.toLowerCase().startsWith("customer:")
      ) {
        if (currentRole && currentText) {
          messages.push({ role: currentRole, text: currentText.trim() });
        }
        currentRole = "client";
        currentText = trimmed.substring(trimmed.indexOf(":") + 1).trim();
      } else {
        // Continue current message
        if (currentText) currentText += " ";
        currentText += trimmed;
      }
    }

    // Add last message
    if (currentRole && currentText) {
      messages.push({ role: currentRole, text: currentText.trim() });
    }

    // If no role indicators found, treat as single agent message
    if (messages.length === 0 && transcript.trim()) {
      messages.push({ role: "agent", text: transcript.trim() });
    }

    return messages;
  };

  const transcriptMessages = parseTranscript(displayCall.transcript);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("callDetails.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>{t("callDetails.loading")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Call Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("callDetails.callInfo")}</Text>

            <View style={styles.statusInfoRow}>
              <View
                style={[
                  styles.compactBadge,
                  {
                    backgroundColor:
                      getStatusColor(displayCall.call_status) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.compactBadgeText,
                    { color: getStatusColor(displayCall.call_status) },
                  ]}
                >
                  {(displayCall.call_status ?? "unknown").toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.compactBadge,
                  { backgroundColor: directionInfo.color + "20" },
                ]}
              >
                <Ionicons
                  name={directionInfo.icon}
                  size={12}
                  color={directionInfo.color}
                />
                <Text
                  style={[
                    styles.compactBadgeText,
                    { color: directionInfo.color },
                  ]}
                >
                  {t(`callDetails.${displayCall.direction ?? "inbound"}`)}
                </Text>
              </View>
              {displayCall.call_type ? (
                <View
                  style={[
                    styles.compactBadge,
                    { backgroundColor: Colors.primary + "20" },
                  ]}
                >
                  <Text
                    style={[styles.compactBadgeText, { color: Colors.primary }]}
                  >
                    {displayCall.call_type.replace(/_/g, " ").toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person" size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.agent")}
                </Text>
                <Text style={styles.compactInfoValue} selectable>
                  {displayAgent.name || "Unknown Agent"}
                </Text>
              </View>
            </View>

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={16} color={Colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.from")}
                </Text>
                <Text style={styles.compactInfoValue} selectable>
                  {displayCall.from_number || "Unknown"}
                </Text>
              </View>
            </View>

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={16} color={Colors.info} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.to")}
                </Text>
                <Text style={styles.compactInfoValue} selectable>
                  {displayCall.to_number || "Unknown"}
                </Text>
              </View>
            </View>

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time" size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.duration")}
                </Text>
                <Text style={styles.compactInfoValue}>
                  {formatDuration(displayCall.duration_ms)}
                </Text>
              </View>
            </View>

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={16} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.started")}
                </Text>
                <Text style={styles.compactInfoValue}>
                  {formatDateTime(displayCall.start_timestamp)}
                </Text>
              </View>
            </View>

            {displayCall.end_timestamp ? (
              <View style={styles.compactInfoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.compactInfoLabel}>
                    {t("callDetails.ended")}
                  </Text>
                  <Text style={styles.compactInfoValue}>
                    {formatDateTime(displayCall.end_timestamp)}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="cash" size={16} color={Colors.warning} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.cost")}
                </Text>
                <Text style={styles.compactInfoValue}>
                  {estimateCost(displayCall.duration_ms)}
                </Text>
              </View>
            </View>

            {displayCall.disconnect_reason ? (
              <View style={styles.compactInfoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={Colors.info}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.compactInfoLabel}>
                    {t("callDetails.disconnectReason")}
                  </Text>
                  <Text style={styles.compactInfoValue}>
                    {displayCall.disconnect_reason}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Contact Section */}
          {otherPartyNumber && (
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person" size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>
                  {t("callDetails.contact", "Contact")}
                </Text>
              </View>

              {existingContact ? (
                <View style={styles.contactInfo}>
                  <View style={styles.contactRow}>
                    <Ionicons
                      name="person-circle"
                      size={48}
                      color={Colors.primary}
                    />
                    <View style={styles.contactDetails}>
                      <Text style={styles.contactName}>
                        {existingContact.name}
                      </Text>
                      <Text style={styles.contactNumber}>
                        {formatPhoneNumber(existingContact.phone_number)}
                      </Text>
                      {existingContact.notes ? (
                        <Text style={styles.contactNotes} numberOfLines={2}>
                          {existingContact.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.contactActionButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/messages",
                          params: { other_party: existingContact.phone_number },
                        })
                      }
                    >
                      <Ionicons
                        name="chatbubble"
                        size={20}
                        color={Colors.primary}
                      />
                      <Text style={styles.contactActionText}>
                        {t("callDetails.message", "Message")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.addContactPrompt}>
                  <Text style={styles.addContactText}>
                    {t("callDetails.unknownNumber", "Unknown number")}
                  </Text>
                  <Text style={styles.addContactSubtext}>
                    {formatPhoneNumber(otherPartyNumber)}
                  </Text>
                  <TouchableOpacity
                    style={styles.addContactButton}
                    onPress={() => openAddContactModal(otherPartyNumber)}
                  >
                    <Ionicons
                      name="person-add"
                      size={18}
                      color={Colors.textWhite}
                    />
                    <Text style={styles.addContactButtonText}>
                      {t("callDetails.addToContacts", "Add to Contacts")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Analysis */}
          {callAnalysis && Object.keys(callAnalysis).length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="analytics" size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>
                  {t("callDetails.analysis")}
                </Text>
              </View>
              <View style={isAnalysisExpanded ? {} : styles.collapsedContent}>
                {callAnalysis.call_summary ? (
                  <View style={styles.analysisSection}>
                    <View style={styles.analysisSectionHeader}>
                      <Ionicons
                        name="document-text"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text style={styles.analysisSectionTitle}>
                        {t("callDetails.summary")}
                      </Text>
                    </View>
                    <Text style={styles.analysisText}>
                      {String(callAnalysis.call_summary)}
                    </Text>
                  </View>
                ) : null}

                {callAnalysis.user_sentiment ? (
                  <View style={styles.analysisSection}>
                    <View style={styles.analysisSectionHeader}>
                      <Ionicons name="heart" size={16} color={Colors.error} />
                      <Text style={styles.analysisSectionTitle}>
                        {t("callDetails.sentiment")}
                      </Text>
                    </View>
                    <View style={styles.sentimentBadge}>
                      <Text style={styles.sentimentText}>
                        {String(callAnalysis.user_sentiment)}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {callAnalysis.call_successful !== undefined ? (
                  <View style={styles.analysisSection}>
                    <View style={styles.analysisSectionHeader}>
                      <Ionicons
                        name={
                          callAnalysis.call_successful
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={16}
                        color={
                          callAnalysis.call_successful
                            ? Colors.success
                            : Colors.error
                        }
                      />
                      <Text style={styles.analysisSectionTitle}>
                        {t("callDetails.outcome")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.outcomeText,
                        {
                          color: callAnalysis.call_successful
                            ? Colors.success
                            : Colors.error,
                        },
                      ]}
                    >
                      {callAnalysis.call_successful
                        ? t("callDetails.successful")
                        : t("callDetails.unsuccessful")}
                    </Text>
                  </View>
                ) : null}
              </View>
              {Object.keys(callAnalysis).length > 0 && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                >
                  <Text style={styles.expandButtonText}>
                    {isAnalysisExpanded ? "Show Less" : "Read More"}
                  </Text>
                  <Ionicons
                    name={isAnalysisExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Transcript */}
          {displayCall.transcript && transcriptMessages.length > 0 ? (
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>
                  {t("callDetails.transcript")}
                </Text>
              </View>
              <View
                style={
                  isTranscriptExpanded
                    ? styles.chatContainer
                    : [styles.chatContainer, styles.collapsedContent]
                }
              >
                {transcriptMessages.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chatMessageRow,
                      message.role === "client" && styles.chatMessageRowRight,
                    ]}
                  >
                    <View
                      style={[
                        styles.chatBubble,
                        message.role === "agent"
                          ? styles.chatBubbleAgent
                          : styles.chatBubbleClient,
                      ]}
                    >
                      <View style={styles.chatBubbleHeader}>
                        <Ionicons
                          name={
                            message.role === "agent" ? "person-circle" : "call"
                          }
                          size={14}
                          color={
                            message.role === "agent"
                              ? Colors.primary
                              : Colors.success
                          }
                        />
                        <Text style={styles.chatBubbleRole}>
                          {message.role === "agent"
                            ? t("callDetails.agent")
                            : t("callDetails.client")}
                        </Text>
                      </View>
                      <Text style={styles.chatBubbleText}>{message.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isTranscriptExpanded
                    ? t("callDetails.showLess", "Show Less")
                    : t("callDetails.readMore", "Read More")}
                </Text>
                <Ionicons
                  name={isTranscriptExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Recording */}
          {displayCall.recording_url ? (
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons
                  name="musical-notes"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.cardTitle}>
                  {t("callDetails.recording", "Recording")}
                </Text>
              </View>

              {/* Playback Progress */}
              {(isPlaying || playbackPosition > 0) && (
                <View style={styles.playbackProgress}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width:
                            playbackDuration > 0
                              ? `${(playbackPosition / playbackDuration) * 100}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.playbackTime}>
                    {formatPlaybackTime(playbackPosition)} /{" "}
                    {formatPlaybackTime(playbackDuration)}
                  </Text>
                </View>
              )}

              <View style={styles.recordingControls}>
                <TouchableOpacity
                  style={[
                    styles.recordingButton,
                    isLoadingAudio && styles.recordingButtonDisabled,
                  ]}
                  onPress={() =>
                    handlePlayRecording(displayCall.recording_url!)
                  }
                  disabled={isLoadingAudio}
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons
                      name={isPlaying ? "pause-circle" : "play-circle"}
                      size={24}
                      color={Colors.primary}
                    />
                  )}
                  <Text style={styles.recordingButtonText}>
                    {isLoadingAudio
                      ? t("callDetails.loadingRecording", "Loading...")
                      : isPlaying
                        ? t("callDetails.pauseRecording", "Pause")
                        : t("callDetails.playRecording", "Play Recording")}
                  </Text>
                </TouchableOpacity>

                {sound && (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStopRecording}
                  >
                    <Ionicons
                      name="stop-circle"
                      size={24}
                      color={Colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("callDetails.addContact", "Add Contact")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddContactModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {t("callDetails.phoneNumber", "Phone Number")}
              </Text>
              <View style={styles.phoneNumberDisplay}>
                <Ionicons name="call" size={20} color={Colors.primary} />
                <Text style={styles.phoneNumberText}>
                  {formatPhoneNumber(selectedPhoneNumber)}
                </Text>
              </View>

              <Text style={styles.inputLabel}>
                {t("callDetails.name", "Name")} *
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("callDetails.enterName", "Enter contact name")}
                placeholderTextColor={Colors.textLight}
                value={contactName}
                onChangeText={setContactName}
              />

              <Text style={styles.inputLabel}>
                {t("callDetails.notes", "Notes")}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder={t("callDetails.enterNotes", "Optional notes...")}
                placeholderTextColor={Colors.textLight}
                value={contactNotes}
                onChangeText={setContactNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                addContactMutation.isPending && styles.saveButtonDisabled,
              ]}
              onPress={handleAddContact}
              disabled={addContactMutation.isPending}
            >
              {addContactMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.textWhite} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {t("callDetails.saveContact", "Save Contact")}
                </Text>
              )}
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
    paddingVertical: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  compactInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoContent: { flex: 1 },
  compactInfoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  compactInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  collapsedContent: {
    maxHeight: 200,
    overflow: "hidden",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  analysisSection: { marginBottom: 12 },
  analysisSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  analysisSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  analysisText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sentimentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sentimentText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "capitalize",
  },
  outcomeText: { fontSize: 14, fontWeight: "600" },
  chatContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  chatMessageRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 4,
  },
  chatMessageRowRight: {
    justifyContent: "flex-end",
  },
  chatBubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 12,
  },
  chatBubbleAgent: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  chatBubbleClient: {
    backgroundColor: Colors.cardBackground,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    borderBottomRightRadius: 4,
  },
  chatBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  chatBubbleRole: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chatBubbleText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  playbackProgress: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  playbackTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  recordingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recordingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  recordingButtonDisabled: {
    opacity: 0.6,
  },
  recordingButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  stopButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.error + "15",
  },
  // Contact styles
  contactInfo: {
    marginTop: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactDetails: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  contactNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactNotes: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: "italic",
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  contactActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: Colors.primaryTransparent,
    borderRadius: 8,
  },
  contactActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.primary,
  },
  addContactPrompt: {
    alignItems: "center",
    paddingVertical: 12,
  },
  addContactText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  addContactSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addContactButtonText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
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
    paddingBottom: 40,
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
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  phoneNumberDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 8,
  },
  phoneNumberText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});
