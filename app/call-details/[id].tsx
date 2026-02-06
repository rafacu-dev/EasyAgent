import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Colors } from "@/app/utils/colors";
import {
  formatDuration,
  formatDateTime,
  formatPhoneNumber,
} from "@/app/utils/formatters";
import { useCallDetails } from "../hooks/useCallDetails";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useContactManagement } from "../hooks/useContactManagement";

export default function CallDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  // Custom hooks
  const {
    isLoading,
    displayCall,
    displayAgent,
    otherPartyNumber,
    callAnalysis,
    transcriptMessages,
    directionInfo,
    getStatusColor,
  } = useCallDetails(id);

  const {
    isPlaying,
    isLoadingAudio,
    playbackPosition,
    playbackDuration,
    handlePlayRecording,
    handleStopRecording,
    formatPlaybackTime,
    sound,
  } = useAudioPlayer();
  const { isLoadingContact, existingContact, handleAddContact } =
    useContactManagement(otherPartyNumber);

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
            {displayAgent.name && displayCall.recording_url && (
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
            )}

            <View style={styles.compactInfoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={16} color={Colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.compactInfoLabel}>
                  {t("callDetails.from")}
                </Text>
                <Text style={styles.compactInfoValue} selectable>
                  {formatPhoneNumber(displayCall.from_number) || "Unknown"}
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
                  {formatPhoneNumber(displayCall.to_number) || "Unknown"}
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
                  {formatDuration(displayCall.duration_ms ?? 0)}
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

              {isLoadingContact ? (
                <View style={styles.loadingContactContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingContactText}>
                    {t("callDetails.loadingContact", "Loading contact...")}
                  </Text>
                </View>
              ) : existingContact ? (
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
                        {formatPhoneNumber(
                          existingContact.phoneNumbers[0]?.number ||
                            otherPartyNumber,
                        )}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.contactActionButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/phone",
                          params: {
                            phoneNumber:
                              existingContact.phoneNumbers[0]?.number ||
                              otherPartyNumber,
                          },
                        })
                      }
                    >
                      <Ionicons name="call" size={20} color={Colors.primary} />
                      <Text style={styles.contactActionText}>
                        {t("callDetails.call", "Call")}
                      </Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                      style={styles.contactActionButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/messages",
                          params: {
                            other_party:
                              existingContact.phoneNumbers[0]?.number ||
                              otherPartyNumber,
                          },
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
                    </TouchableOpacity> */}
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
                    onPress={() => handleAddContact(otherPartyNumber)}
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
  loadingContactContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingContactText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
