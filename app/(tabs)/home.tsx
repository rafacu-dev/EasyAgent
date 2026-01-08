import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Colors } from "../../utils/colors";
import { router } from "expo-router";
import { useAgent } from "../../utils/AgentContext";
import { apiClient } from "../../utils/axios-interceptor";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import type { RecentCallItem } from "../../utils/types";

// RecentCallItem type moved to global `utils/types.d.ts`

// Removed mock data; now using live API via React Query

export default function HomeScreen() {
  const { t } = useTranslation();
  const { agentConfig, phoneNumber } = useAgent();

  const agentDbId = agentConfig?.id ?? null;

  const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) return "0:00";
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestampMs?: number) => {
    if (!timestampMs) return "";
    const d = new Date(timestampMs);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Stats query
  const {
    data: statsResp,
    isLoading: statsLoading,
    error: statsErr,
  } = useQuery({
    queryKey: ["agent-stats", agentDbId],
    enabled: !!agentDbId,
    queryFn: () => apiClient.get(`agents/${agentDbId}/call-traffic/`),
  });

  const statistics = statsResp?.statistics ?? {};
  const stats = {
    totalCalls: statistics.total_calls ?? 0,
    ongoingCalls: statistics.ongoing_calls ?? 0,
    totalDurationMinutes: statistics.total_duration_minutes ?? 0,
  };

  // Recent calls limited to 10
  const {
    data: callsResp,
    isLoading: callsLoading,
    error: callsErr,
  } = useQuery({
    queryKey: ["recent-calls", agentDbId],
    enabled: !!agentDbId,
    queryFn: () =>
      apiClient.get(
        `calls/?agent_id=${encodeURIComponent(
          String(agentDbId)
        )}&limit=10&sort_order=descending&call_type=phone_call`
      ),
  });
  console.log("Recent calls response:", callsResp, statsResp);

  // Mock data for testing (memoized)
  const mockCalls = useMemo<RecentCallItem[]>(
    () => [
      {
        id: "1",
        number: "+1 555-0123",
        duration: "5:23",
        date: "2026-01-07",
        status: "ended",
        direction: "inbound",
        fromNumber: "+1 555-0123",
        toNumber: phoneNumber || "+1 555-TEST",
      },
      {
        id: "2",
        number: "+1 555-0456",
        duration: "3:15",
        date: "2026-01-07",
        status: "ended",
        direction: "outbound",
        fromNumber: phoneNumber || "+1 555-TEST",
        toNumber: "+1 555-0456",
      },
      {
        id: "3",
        number: "+1 555-0789",
        duration: "8:42",
        date: "2026-01-06",
        status: "ended",
        direction: "inbound",
        fromNumber: "+1 555-0789",
        toNumber: phoneNumber || "+1 555-TEST",
      },
      {
        id: "4",
        number: "+1 555-0321",
        duration: "0:00",
        date: "2026-01-06",
        status: "missed",
        direction: "inbound",
        fromNumber: "+1 555-0321",
        toNumber: phoneNumber || "+1 555-TEST",
      },
      {
        id: "5",
        number: "+1 555-0654",
        duration: "6:55",
        date: "2026-01-05",
        status: "ended",
        direction: "outbound",
        fromNumber: phoneNumber || "+1 555-TEST",
        toNumber: "+1 555-0654",
      },
    ],
    [phoneNumber]
  );

  const calls: RecentCallItem[] = useMemo(() => {
    const rawCalls: any[] = callsResp?.calls ?? [];
    const realCalls = rawCalls.map((c: any) => {
      const direction = c?.direction;
      const number = direction === "inbound" ? c?.from_number : c?.to_number;
      return {
        id: c?.call_id ?? `${c?.start_timestamp ?? Math.random()}`,
        number: number ?? "Unknown",
        duration: formatDuration(c?.duration_ms),
        date: formatDate(c?.start_timestamp),
        status: c?.call_status ?? "",
        direction: direction ?? "unknown",
        fromNumber: c?.from_number ?? "Unknown",
        toNumber: c?.to_number ?? "Unknown",
      };
    });
    // Use mock data if no real calls for testing
    return realCalls.length > 0 ? realCalls : mockCalls;
  }, [callsResp, mockCalls]);

  const error = (statsErr || callsErr)?.message as string | undefined;

  // Animated loading skeleton helpers
  const pulse = useSharedValue(0.6);
  pulse.value = withTiming(1, { duration: 800 });
  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const SkeletonBar = ({
    width,
    height,
    style,
  }: {
    width: number | string;
    height: number;
    style?: any;
  }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 8,
          backgroundColor: Colors.backgroundLight,
          marginVertical: 6,
        },
        skeletonStyle,
        style,
      ]}
    />
  );

  const renderCallItem = ({ item }: { item: RecentCallItem }) => (
    <TouchableOpacity
      style={styles.callItem}
      onPress={() =>
        router.push({ pathname: "/call-details/[id]", params: { id: item.id } })
      }
    >
      <View
        style={[
          styles.callStatusDot,
          item.status === "missed" && styles.callStatusMissed,
        ]}
      />
      <View style={styles.callInfo}>
        <View style={styles.callNumberRow}>
          <Text style={styles.callDirectionLabel}>
            {item.direction === "inbound" ? "From" : "To"}:
          </Text>
          <Text style={styles.callNumber}>{item.number}</Text>
        </View>
        <Text style={styles.callDate}>{item.date}</Text>
      </View>
      <Text style={styles.callDuration}>{item.duration}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );

  const ListHeaderComponent = () => (
    <>
      {/* Header with Welcome and Agent Name */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t("home.welcome", "Welcome")},{" "}
          {agentConfig?.companyName ||
            t("home.yourDashboard", "Your Dashboard")}
        </Text>
        {error ? <Text style={styles.headerSubtitle}>{error}</Text> : null}
      </View>

      {/* Agent Card */}
      <View style={styles.agentCardContainer}>
        <TouchableOpacity
          style={styles.agentCard}
          onPress={() => router.push("/edit-agent")}
        >
          <View style={styles.agentAvatar}>
            <Ionicons
              name={agentConfig?.agentGender === "female" ? "woman" : "man"}
              size={32}
              color={Colors.primary}
            />
          </View>
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>
              {agentConfig?.agentName || t("home.agent", "Agent")}
            </Text>
            <Text style={styles.agentSector}>
              {t(`templates.${agentConfig?.sector}` || "General")}
            </Text>
            <Text style={styles.agentNumber}>
              Number: {phoneNumber || "+1 555-TEST"}
            </Text>
          </View>
          <Ionicons name="settings-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Container */}
      <View style={styles.statsContainer}>
        {statsLoading ? (
          <>
            <View style={styles.statCard}>
              <SkeletonBar width={60} height={16} />
              <SkeletonBar width={40} height={12} />
            </View>
            <View style={styles.statCard}>
              <SkeletonBar width={60} height={16} />
              <SkeletonBar width={40} height={12} />
            </View>
            <View style={styles.statCard}>
              <SkeletonBar width={60} height={16} />
              <SkeletonBar width={40} height={12} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <Ionicons
                  name="call"
                  size={18}
                  color={Colors.primary}
                  style={styles.statIconInline}
                />
                <Text style={styles.statValue}>{stats.totalCalls}</Text>
              </View>
              <Text style={styles.statLabel}>
                {t("home.totalCalls", "Total Calls")}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <Ionicons
                  name="time"
                  size={18}
                  color={Colors.success}
                  style={styles.statIconInline}
                />
                <Text style={styles.statValue}>{stats.ongoingCalls}</Text>
              </View>
              <Text style={styles.statLabel}>
                {t("home.ongoingCalls", "Active Calls")}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <Ionicons
                  name="trending-up"
                  size={18}
                  color={Colors.info}
                  style={styles.statIconInline}
                />
                <Text style={styles.statValue}>
                  {Math.round(stats.totalDurationMinutes)}m
                </Text>
              </View>
              <Text style={styles.statLabel}>
                {t("home.totalDuration", "Total Duration")}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/(tabs)/phone")}
        >
          <Ionicons name="call" size={18} color={Colors.primary} />
          <Text style={styles.actionButtonText}>
            {t("home.makeCall", "Make Call")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/(tabs)/calendar")}
        >
          <Ionicons name="document-text" size={18} color={Colors.primary} />
          <Text style={styles.actionButtonText}>
            {t("home.viewLogs", "Call Logs")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Ionicons name="analytics" size={18} color={Colors.primary} />
          <Text style={styles.actionButtonText}>
            {t("home.analytics", "Analytics")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      <View style={styles.callsListContainer}>
        <Text style={styles.sectionTitle}>
          {t("home.recentCalls", "Recent Calls")}
        </Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <ListHeaderComponent />
      <View style={styles.callsListWrapper}>
        {callsLoading ? (
          <View style={styles.callsListCard}>
            {[...Array(5)].map((_, idx) => (
              <View
                key={idx}
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.borderLight,
                }}
              >
                <SkeletonBar width={"60%"} height={12} />
                <SkeletonBar width={"40%"} height={10} />
              </View>
            ))}
          </View>
        ) : calls.length === 0 ? (
          <View style={styles.callsListCard}>
            <Text style={styles.headerSubtitle}>No recent calls</Text>
          </View>
        ) : (
          <View style={styles.callsListCard}>
            <FlatList
              data={calls}
              renderItem={renderCallItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.callsList}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  callsListWrapper: {
    flex: 1,
    marginBottom: 20,
  },
  callsListCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 0,
    marginHorizontal: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    borderColor: "transparent",
  },
  header: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  agentCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  agentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  agentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  agentSector: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
  },
  agentNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statIconInline: {
    marginRight: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  callsListContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  callsList: {
    flex: 1,
    backgroundColor: "transparent",
    paddingBottom: 20,
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 20,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  callStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusActive,
    marginRight: 12,
  },
  callStatusMissed: {
    backgroundColor: Colors.statusMissed,
  },
  callInfo: {
    flex: 1,
  },
  callNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  callDirectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginRight: 4,
  },
  callNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  callDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  callDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
    fontWeight: "500",
  },
});
