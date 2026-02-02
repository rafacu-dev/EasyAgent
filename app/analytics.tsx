import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { useAnalytics } from "@/app/hooks/useAnalytics";
import { StatCard, HourlyChart, InsightsCard } from "@/app/components/analytics";

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const {
    agentDbId,
    agentName,
    date,
    stats,
    callsByHour,
    maxHourlyValue,
    peakHour,
    inboundRate,
    completionRate,
    isLoading,
    error,
    refetch,
  } = useAnalytics();

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
                <Text style={styles.agentName}>{agentName}</Text>
                <Text style={styles.agentDate}>
                  {t("analytics.dataFor", "Data for")}: {date}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="call"
              label={t("analytics.totalCalls", "Total Calls")}
              value={stats.total_calls}
              color={Colors.primary}
            />
            <StatCard
              icon="arrow-down"
              label={t("analytics.inbound", "Inbound")}
              value={stats.inbound_calls}
              color={Colors.success}
            />
            <StatCard
              icon="arrow-up"
              label={t("analytics.outbound", "Outbound")}
              value={stats.outbound_calls}
              color={Colors.info}
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon="checkmark-circle"
              label={t("analytics.ended", "Ended")}
              value={stats.ended_calls}
              color={Colors.textSecondary}
            />
            <StatCard
              icon="radio-button-on"
              label={t("analytics.ongoing", "Ongoing")}
              value={stats.ongoing_calls}
              color={Colors.statusActive}
            />
            <StatCard
              icon="time"
              label={t("analytics.totalDuration", "Total Duration (min)")}
              value={stats.total_duration_minutes}
              color={Colors.warning}
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon="stats-chart"
              label={t("analytics.avgDuration", "Avg Duration (min)")}
              value={stats.average_duration_minutes}
              color={Colors.purple}
            />
          </View>

          {/* Hourly Chart */}
          <HourlyChart
            callsByHour={callsByHour}
            maxHourlyValue={maxHourlyValue}
          />

          {/* Additional Insights */}
          <InsightsCard
            peakHour={peakHour}
            inboundRate={inboundRate}
            completionRate={completionRate}
          />
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  agentInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
  },
  agentDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
});
