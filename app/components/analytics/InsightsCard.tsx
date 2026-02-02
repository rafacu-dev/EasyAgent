import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface InsightsCardProps {
  peakHour: string;
  inboundRate: number;
  completionRate: number;
}

export function InsightsCard({
  peakHour,
  inboundRate,
  completionRate,
}: InsightsCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.insightsCard}>
      <Text style={styles.insightsTitle}>
        {t("analytics.insights", "Key Insights")}
      </Text>
      <View style={styles.insightRow}>
        <Ionicons name="trending-up" size={20} color={Colors.success} />
        <Text style={styles.insightText}>
          {t("analytics.peakHour", "Peak call hour")}:{" "}
          <Text style={styles.insightValue}>{peakHour}:00</Text>
        </Text>
      </View>
      <View style={styles.insightRow}>
        <Ionicons name="pie-chart" size={20} color={Colors.info} />
        <Text style={styles.insightText}>
          {t("analytics.inboundRate", "Inbound rate")}:{" "}
          <Text style={styles.insightValue}>{inboundRate}%</Text>
        </Text>
      </View>
      <View style={styles.insightRow}>
        <Ionicons name="checkmark-done" size={20} color={Colors.success} />
        <Text style={styles.insightText}>
          {t("analytics.completionRate", "Completion rate")}:{" "}
          <Text style={styles.insightValue}>{completionRate}%</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  insightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  insightValue: {
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
});
