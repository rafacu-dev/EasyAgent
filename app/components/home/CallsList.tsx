/**
 * CallsList Component
 *
 * SectionList of calls grouped by date with pull-to-refresh
 */

import React, { memo } from "react";
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { CallItem } from "./CallItem";
import { SkeletonBar } from "./SkeletonBar";
import type { CallSection } from "@/app/hooks/useHome";
import type { RecentCallItem } from "@/app/utils/types";

interface CallsListProps {
  sections: CallSection[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export const CallsList = memo(function CallsList({
  sections,
  isLoading,
  refreshing,
  onRefresh,
}: CallsListProps) {
  const { t } = useTranslation();

  const renderItem = ({ item }: { item: RecentCallItem }) => (
    <CallItem item={item} />
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.card}>
        {[...Array(5)].map((_, idx) => (
          <View key={idx} style={styles.skeletonItem}>
            <SkeletonBar width="60%" height={12} />
            <SkeletonBar width="40%" height={10} />
          </View>
        ))}
      </View>
    );
  }

  // Empty state
  if (sections.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="call-outline" size={48} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>
            {t("home.noCallsYet", "No Calls Yet")}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t(
              "home.noCallsDescription",
              "Your recent calls will appear here once you start making or receiving calls.",
            )}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 0,
    marginHorizontal: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  list: {
    flex: 1,
    backgroundColor: "transparent",
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textSecondary,
  },
  skeletonItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default CallsList;
