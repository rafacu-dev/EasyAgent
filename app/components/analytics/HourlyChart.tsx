import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

const { width } = Dimensions.get("window");

interface HourlyChartProps {
  callsByHour: Record<string, number>;
  maxHourlyValue: number;
}

export function HourlyChart({ callsByHour, maxHourlyValue }: HourlyChartProps) {
  const { t } = useTranslation();
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
                      height: `${Math.max(heightPercent, count > 0 ? 5 : 0)}%`,
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
}

const styles = StyleSheet.create({
  chartContainer: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  chartBarsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    backgroundColor: Colors.primary,
    borderRadius: 2,
    justifyContent: "flex-start",
    alignItems: "center",
    minHeight: 0,
  },
  barLabel: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 2,
  },
  hourLabel: {
    fontSize: 8,
    color: Colors.textLight,
    marginTop: 4,
  },
});
