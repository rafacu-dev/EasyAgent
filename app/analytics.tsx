import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "../utils/colors";
import { useAgent } from "../utils/AgentContext";
import { apiClient } from "../utils/axios-interceptor";
import { useQuery } from "@tanstack/react-query";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { agentConfig } = useAgent();
  const agentDbId = agentConfig?.id ?? null;

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics", agentDbId],
    enabled: !!agentDbId,
    queryFn: () => apiClient.get(`agents/${agentDbId}/call-traffic/`),
  });

  const stats = analyticsData?.statistics ?? {};
  const callsByHour = analyticsData?.calls_by_hour ?? {};

  // Find max value for chart scaling
  const maxHourlyValue = Math.max(
    ...Object.values(callsByHour).map((v) => Number(v) || 0),
    1
  );

  const renderStatCard = (
    icon: string,
    label: string,
    value: string | number,
    color: string
  ) => (
    <View style={styles.statCard}>
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
      >
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderHourlyChart = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const barWidth = (width - 64) / 24 - 4;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {t("analytics.callsByHour", "Calls by Hour")}
        </Text>
        <View style={styles.chartBarsContainer}>
          {hours.map((hour) => {
            const count = Number(callsByHour[hour.toString()] || 0);
            const heightPercent =
              maxHourlyValue > 0 ? (count / maxHourlyValue) * 100 : 0;

            return (
              <View key={hour} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(
                          heightPercent,
                          count > 0 ? 5 : 0
                        )}%`,
                        width: barWidth,
                      },
                    ]}
                  >
                    {count > 0 && <Text style={styles.barLabel}>{count}</Text>}
                  </View>
                </View>
                <Text style={styles.hourLabel}>{hour}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!agentDbId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("analytics.title", "Analytics")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.textLight} />
          <Text style={styles.errorText}>
            {t("analytics.noAgent", "No agent configured")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("analytics.title", "Analytics")}
        </Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {t("analytics.loading", "Loading analytics...")}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>
            {t("analytics.error", "Failed to load analytics")}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>
              {t("analytics.retry", "Retry")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Agent Info */}
          <View style={styles.agentInfoCard}>
            <View style={styles.agentInfoHeader}>
              <Ionicons name="person-circle" size={40} color={Colors.primary} />
              <View style={styles.agentInfoText}>
                <Text style={styles.agentName}>
                  {analyticsData?.agent_name}
                </Text>
                <Text style={styles.agentDate}>
                  {t("analytics.dataFor", "Data for")}: {analyticsData?.date}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            {renderStatCard(
              "call",
              t("analytics.totalCalls", "Total Calls"),
              stats.total_calls ?? 0,
              Colors.primary
            )}
            {renderStatCard(
              "arrow-down",
              t("analytics.inbound", "Inbound"),
              stats.inbound_calls ?? 0,
              Colors.success
            )}
            {renderStatCard(
              "arrow-up",
              t("analytics.outbound", "Outbound"),
              stats.outbound_calls ?? 0,
              Colors.info
            )}
            {renderStatCard(
              "checkmark-circle",
              t("analytics.ended", "Ended"),
              stats.ended_calls ?? 0,
              Colors.textSecondary
            )}
          </View>

          <View style={styles.statsGrid}>
            {renderStatCard(
              "radio-button-on",
              t("analytics.ongoing", "Ongoing"),
              stats.ongoing_calls ?? 0,
              Colors.statusActive
            )}
            {renderStatCard(
              "time",
              t("analytics.totalDuration", "Total Duration (min)"),
              stats.total_duration_minutes ?? 0,
              Colors.warning
            )}
            {renderStatCard(
              "stats-chart",
              t("analytics.avgDuration", "Avg Duration (min)"),
              stats.average_duration_minutes ?? 0,
              Colors.purple
            )}
          </View>

          {/* Hourly Chart */}
          {renderHourlyChart()}

          {/* Additional Insights */}
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>
              {t("analytics.insights", "Key Insights")}
            </Text>
            <View style={styles.insightRow}>
              <Ionicons name="trending-up" size={20} color={Colors.success} />
              <Text style={styles.insightText}>
                {t("analytics.peakHour", "Peak call hour")}:{" "}
                <Text style={styles.insightValue}>
                  {Object.entries(callsByHour).reduce(
                    (max, [hour, count]) =>
                      Number(count) > Number(callsByHour[max] || 0)
                        ? hour
                        : max,
                    "0"
                  )}
                  :00
                </Text>
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Ionicons name="pie-chart" size={20} color={Colors.info} />
              <Text style={styles.insightText}>
                {t("analytics.inboundRate", "Inbound rate")}:{" "}
                <Text style={styles.insightValue}>
                  {stats.total_calls > 0
                    ? Math.round(
                        ((stats.inbound_calls || 0) / stats.total_calls) * 100
                      )
                    : 0}
                  %
                </Text>
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Ionicons
                name="checkmark-done"
                size={20}
                color={Colors.success}
              />
              <Text style={styles.insightText}>
                {t("analytics.completionRate", "Completion rate")}:{" "}
                <Text style={styles.insightValue}>
                  {stats.total_calls > 0
                    ? Math.round(
                        ((stats.ended_calls || 0) / stats.total_calls) * 100
                      )
                    : 0}
                  %
                </Text>
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  agentInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agentInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  agentInfoText: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  agentDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  chartBarsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 200,
    paddingTop: 20,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 4,
  },
  barLabel: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "600",
  },
  hourLabel: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  insightValue: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
