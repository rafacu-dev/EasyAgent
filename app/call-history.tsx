import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { Colors } from "../utils/colors";
import { useAgent } from "../utils/AgentContext";
import { apiClient } from "../utils/axios-interceptor";
import { useQuery } from "@tanstack/react-query";
import type { RecentCallItem } from "../utils/types";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CallHistoryScreen() {
  const { t } = useTranslation();
  const { agentConfig } = useAgent();
  const agentDbId = agentConfig?.id ?? null;

  const [callTypeFilter, setCallTypeFilter] = useState<"all" | "phone" | "web">(
    "all"
  );
  const [directionFilter, setDirectionFilter] = useState<
    "all" | "inbound" | "outbound"
  >("all");
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [paginationKey, setPaginationKey] = useState<string | null>(null);
  const [allCalls, setAllCalls] = useState<RecentCallItem[]>([]);

  // Date range states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const buildQueryParams = (pagination?: string | null) => {
    let params = `agent_id=${encodeURIComponent(
      String(agentDbId)
    )}&limit=50&sort_order=descending`;

    if (callTypeFilter !== "all") {
      params += `&call_type=${
        callTypeFilter === "phone" ? "phone_call" : "web_call"
      }`;
    }

    if (directionFilter !== "all") {
      params += `&direction=${directionFilter}`;
    }

    // Phone number filters - send to backend
    if (fromNumber.trim()) {
      params += `&from_number=${encodeURIComponent(fromNumber.trim())}`;
    }

    if (toNumber.trim()) {
      params += `&to_number=${encodeURIComponent(toNumber.trim())}`;
    }

    // Date range filters - send timestamps in milliseconds since epoch
    if (startDate) {
      // Set to start of day (00:00:00)
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      params += `&start_timestamp_after=${startOfDay.getTime()}`;
    }

    if (endDate) {
      // Set to end of day (23:59:59.999)
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      params += `&start_timestamp_before=${endOfDay.getTime()}`;
    }

    if (pagination) {
      params += `&pagination_key=${pagination}`;
    }

    return params;
  };

  const {
    data: callsResp,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "call-history",
      agentDbId,
      callTypeFilter,
      directionFilter,
      fromNumber,
      toNumber,
      startDate,
      endDate,
      paginationKey,
    ],
    enabled: !!agentDbId,
    queryFn: async () => {
      const response = await apiClient.get(
        `calls/?${buildQueryParams(paginationKey)}`
      );
      return response;
    },
  });

  const calls: RecentCallItem[] = useMemo(() => {
    const rawCalls: any[] = callsResp?.calls ?? [];
    const newCalls = rawCalls.map((c: any) => {
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
        callType: c?.call_type ?? "",
      };
    });

    // If loading more, append to existing calls
    if (paginationKey && allCalls.length > 0) {
      const combined = [...allCalls, ...newCalls];
      setAllCalls(combined);
      return combined;
    } else {
      // First load or filter change
      setAllCalls(newCalls);
      return newCalls;
    }
  }, [callsResp, paginationKey]);

  const handleLoadMore = () => {
    const lastCallId = callsResp?.pagination_key;
    if (lastCallId) {
      setPaginationKey(lastCallId);
    }
  };

  const handleApplyFilters = () => {
    setPaginationKey(null);
    setAllCalls([]);
    refetch();
  };

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
          <Ionicons
            name={item.direction === "inbound" ? "arrow-down" : "arrow-up"}
            size={14}
            color={item.direction === "inbound" ? Colors.success : Colors.info}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.callDirectionLabel}>
            {item.direction === "inbound" ? "From" : "To"}:
          </Text>
          <Text style={styles.callNumber} selectable>
            {item.number}
          </Text>
        </View>
        <View style={styles.callMetaRow}>
          <Text style={styles.callDate} selectable>
            {item.date}
          </Text>
          {item.callType && (
            <View style={styles.callTypeBadge}>
              <Text style={styles.callTypeText}>
                {item.callType.replace("_", " ")}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.callDuration} selectable>
        {item.duration}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={styles.filterToggleButton}
        onPress={() => setShowFilters(!showFilters)}
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
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  callTypeFilter === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setCallTypeFilter("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    callTypeFilter === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  {t("home.filterAll", "All")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  callTypeFilter === "phone" && styles.filterButtonActive,
                ]}
                onPress={() => setCallTypeFilter("phone")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    callTypeFilter === "phone" && styles.filterButtonTextActive,
                  ]}
                >
                  {t("home.filterPhone", "Phone")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  callTypeFilter === "web" && styles.filterButtonActive,
                ]}
                onPress={() => setCallTypeFilter("web")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    callTypeFilter === "web" && styles.filterButtonTextActive,
                  ]}
                >
                  {t("home.filterWeb", "Web")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Direction Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.direction", "Direction")}
            </Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  directionFilter === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setDirectionFilter("all")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    directionFilter === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  {t("home.filterAll", "All")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  directionFilter === "inbound" && styles.filterButtonActive,
                ]}
                onPress={() => setDirectionFilter("inbound")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    directionFilter === "inbound" &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {t("callHistory.inbound", "Inbound")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  directionFilter === "outbound" && styles.filterButtonActive,
                ]}
                onPress={() => setDirectionFilter("outbound")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    directionFilter === "outbound" &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {t("callHistory.outbound", "Outbound")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone Number Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.fromNumber", "From Number")}
            </Text>
            <TextInput
              key="fromNumber"
              style={styles.filterInput}
              placeholder={t(
                "callHistory.fromNumberPlaceholder",
                "Search by caller..."
              )}
              placeholderTextColor={Colors.textLight}
              value={fromNumber}
              onChangeText={setFromNumber}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("callHistory.toNumber", "To Number")}
            </Text>
            <TextInput
              key="toNumber"
              style={styles.filterInput}
              placeholder={t(
                "callHistory.toNumberPlaceholder",
                "Search by recipient..."
              )}
              placeholderTextColor={Colors.textLight}
              value={toNumber}
              onChangeText={setToNumber}
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
                onPress={() => setShowStartPicker(true)}
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
                onPress={() => setShowEndPicker(true)}
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
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                <Text style={styles.clearDatesText}>
                  {t("callHistory.clearDates", "Clear Dates")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Apply Filters Button */}
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>
              {t("callHistory.applyFilters", "Apply Filters")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {t("callHistory.showing", "Showing")} {calls.length}{" "}
          {t("callHistory.calls", "calls")}
        </Text>
      </View>
    </View>
  );

  const ListFooterComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }

    if (callsResp?.pagination_key && calls.length > 0) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
        >
          <Text style={styles.loadMoreText}>
            {t("callHistory.loadMore", "Load More")}
          </Text>
          <Ionicons name="arrow-down-circle" size={20} color={Colors.primary} />
        </TouchableOpacity>
      );
    }

    if (calls.length > 0) {
      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>
            {t("callHistory.noMoreCalls", "No more calls to load")}
          </Text>
        </View>
      );
    }

    return null;
  };

  const ListEmptyComponent = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="call-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyStateText}>
          {t("callHistory.noCalls", "No calls found")}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {t("callHistory.noCallsDesc", "Try adjusting your filters")}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("callHistory.title", "Call History")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters Header - Fixed, doesn't scroll */}
      {renderHeader()}

      {/* Call List - Only this scrolls */}
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === "ios");
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === "ios");
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
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
    paddingTop: 48,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },
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
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
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
    marginBottom: 4,
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
  callMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  callTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.primary + "20",
    borderRadius: 4,
  },
  callTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "capitalize",
  },
  callDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
    fontWeight: "500",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  endOfList: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: "center",
  },
});
