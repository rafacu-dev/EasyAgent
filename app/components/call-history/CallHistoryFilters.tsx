import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import type {
  CallTypeFilter,
  DirectionFilter,
} from "@/app/hooks/useCallHistory";

interface CallHistoryFiltersProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  callTypeFilter: CallTypeFilter;
  onCallTypeChange: (filter: CallTypeFilter) => void;
  directionFilter: DirectionFilter;
  onDirectionChange: (filter: DirectionFilter) => void;
  fromNumber: string;
  onFromNumberChange: (value: string) => void;
  toNumber: string;
  onToNumberChange: (value: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  onShowStartPicker: () => void;
  onShowEndPicker: () => void;
  onClearDates: () => void;
  onApplyFilters: () => void;
  callsCount: number;
}

export function CallHistoryFilters({
  showFilters,
  onToggleFilters,
  callTypeFilter,
  onCallTypeChange,
  directionFilter,
  onDirectionChange,
  fromNumber,
  onFromNumberChange,
  toNumber,
  onToNumberChange,
  startDate,
  endDate,
  onShowStartPicker,
  onShowEndPicker,
  onClearDates,
  onApplyFilters,
  callsCount,
}: CallHistoryFiltersProps) {
  const { t } = useTranslation();

  return (
    <View>
      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={styles.filterToggleButton}
        onPress={onToggleFilters}
      >
        <Ionicons name="filter" size={20} color={Colors.primary} />
        <Text style={styles.filterToggleText}>
          {showFilters
            ? t("callHistory.hideFilters", "Hide Filters")
            : t("callHistory.showFilters", "Show Filters")}
        </Text>
        <Ionicons
          name={showFilters ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Call Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.callType", "Call Type")}
            </Text>
            <View style={styles.filterButtons}>
              {(["all", "retell", "twilio"] as CallTypeFilter[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    callTypeFilter === type && styles.filterButtonActive,
                  ]}
                  onPress={() => onCallTypeChange(type)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      callTypeFilter === type && styles.filterButtonTextActive,
                    ]}
                  >
                    {type === "all"
                      ? t("home.filterAll", "All")
                      : type === "retell"
                        ? t("home.filterRetell", "Agent")
                        : t("home.filterTwilio", "Phone")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Direction Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.direction", "Direction")}
            </Text>
            <View style={styles.filterButtons}>
              {(["all", "inbound", "outbound"] as DirectionFilter[]).map(
                (dir) => (
                  <TouchableOpacity
                    key={dir}
                    style={[
                      styles.filterButton,
                      directionFilter === dir && styles.filterButtonActive,
                    ]}
                    onPress={() => onDirectionChange(dir)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        directionFilter === dir &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {dir === "all"
                        ? t("home.filterAll", "All")
                        : dir === "inbound"
                          ? t("callHistory.inbound", "Inbound")
                          : t("callHistory.outbound", "Outbound")}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>

          {/* Phone Number Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.fromNumber", "From Number")}
            </Text>
            <TextInput
              style={styles.filterInput}
              placeholder={t(
                "callHistory.fromNumberPlaceholder",
                "Search by caller...",
              )}
              placeholderTextColor={Colors.textLight}
              value={fromNumber}
              onChangeText={onFromNumberChange}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.toNumber", "To Number")}
            </Text>
            <TextInput
              style={styles.filterInput}
              placeholder={t(
                "callHistory.toNumberPlaceholder",
                "Search by recipient...",
              )}
              placeholderTextColor={Colors.textLight}
              value={toNumber}
              onChangeText={onToNumberChange}
            />
          </View>

          {/* Date Range Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.dateRange", "Date Range")}
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={onShowStartPicker}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.dateButtonText}>
                  {startDate
                    ? startDate.toLocaleDateString()
                    : t("callHistory.startDate", "Start Date")}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateRangeSeparator}>-</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={onShowEndPicker}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.dateButtonText}>
                  {endDate
                    ? endDate.toLocaleDateString()
                    : t("callHistory.endDate", "End Date")}
                </Text>
              </TouchableOpacity>
            </View>
            {(startDate || endDate) && (
              <TouchableOpacity
                style={styles.clearDatesButton}
                onPress={onClearDates}
              >
                <Text style={styles.clearDatesText}>
                  {t("callHistory.clearDates", "Clear Dates")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Apply Filters Button */}
          <TouchableOpacity style={styles.applyButton} onPress={onApplyFilters}>
            <Text style={styles.applyButtonText}>
              {t("callHistory.applyFilters", "Apply Filters")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {t("callHistory.showing", "Showing")} {callsCount}{" "}
          {t("callHistory.calls", "calls")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  filtersPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  filterInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  dateRangeSeparator: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  clearDatesButton: {
    marginTop: 8,
    alignItems: "center",
  },
  clearDatesText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "600",
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
