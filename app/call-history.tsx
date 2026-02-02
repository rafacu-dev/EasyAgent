import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "@/app/utils/colors";
import { useCallHistory } from "@/app/hooks/useCallHistory";
import {
  CallHistoryFilters,
  CallHistoryItem,
} from "@/app/components/call-history";

export default function CallHistoryScreen() {
  const { t } = useTranslation();
  const {
    callTypeFilter,
    setCallTypeFilter,
    directionFilter,
    setDirectionFilter,
    fromNumber,
    setFromNumber,
    toNumber,
    setToNumber,
    showFilters,
    setShowFilters,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    clearDates,
    handleLoadMore,
    hasMore,
    calls,
    isLoading,
    handleApplyFilters,
  } = useCallHistory();

  const ListFooterComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }

    if (hasMore && calls.length > 0) {
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

      {/* Filters Header */}
      <CallHistoryFilters
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        callTypeFilter={callTypeFilter}
        onCallTypeChange={setCallTypeFilter}
        directionFilter={directionFilter}
        onDirectionChange={setDirectionFilter}
        fromNumber={fromNumber}
        onFromNumberChange={setFromNumber}
        toNumber={toNumber}
        onToNumberChange={setToNumber}
        startDate={startDate}
        endDate={endDate}
        onShowStartPicker={() => setShowStartPicker(true)}
        onShowEndPicker={() => setShowEndPicker(true)}
        onClearDates={clearDates}
        onApplyFilters={handleApplyFilters}
        callsCount={calls.length}
      />

      {/* Call List */}
      <FlatList
        data={calls}
        renderItem={({ item }) => <CallHistoryItem item={item} />}
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
