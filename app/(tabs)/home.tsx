/**
 * Home Screen
 *
 * Dashboard with recent calls, notifications, and call filtering
 * Uses useHome hook for state management and home components for UI
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/app/utils/colors";
import { useHome } from "@/app/hooks/useHome";
import NoPhoneNumber from "@/app/components/NoPhoneNumber";
import {
  NotificationsCard,
  CallsFilter,
  SearchBar,
  CallsList,
} from "@/app/components/home";

export default function HomeScreen() {
  const { t } = useTranslation();

  const {
    // Loading states
    isLoadingAgent,
    isLoadingPhone,
    isLoadingCalls,
    isLoadingNotifications,

    // Data
    agentConfig,
    phoneNumber,
    callSections,
    notifications,
    error,

    // Filter
    callTypeFilter,
    setCallTypeFilter,

    // Search
    searchQuery,
    setSearchQuery,

    // Refresh
    refreshing,
    onRefresh,
  } = useHome();

  // Header component used in all states
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle}>
          {t("home.welcome", "Welcome")},{" "}
          {agentConfig?.companyName || t("home.yourDashboard", "Your Dashboard")}
        </Text>
      </View>
      {error && <Text style={styles.headerSubtitle}>{error}</Text>}
    </View>
  );

  // Loading state
  if (isLoadingAgent || isLoadingPhone || !agentConfig) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>
            {t("home.loading", "Loading...")}
          </Text>
        </View>
      </View>
    );
  }

  // No phone number view
  if (!phoneNumber) {
    return (
      <View style={styles.container}>
        <Header />
        <NoPhoneNumber variant="detailed" translationPrefix="home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header />

      {/* Expo Go Dev Button */}
      {Constants.appOwnership === "expo" && (
        <TouchableOpacity
          style={styles.expoGoButton}
          onPress={() => router.push("/paywall/PaywallScreen")}
        >
          <Ionicons name="rocket" size={16} color="#fff" />
          <Text style={styles.expoGoButtonText}>Paywall</Text>
        </TouchableOpacity>
      )}

      {/* Notifications Card */}
      <NotificationsCard
        newCalls={notifications?.newCalls ?? 0}
        newAppointments={notifications?.newAppointments ?? 0}
        isLoading={isLoadingNotifications}
      />

      {/* Calls Filter */}
      <CallsFilter filter={callTypeFilter} onFilterChange={setCallTypeFilter} />

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Calls List */}
      <View style={styles.callsListWrapper}>
        <CallsList
          sections={callSections}
          isLoading={isLoadingCalls}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  expoGoButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  expoGoButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  callsListWrapper: {
    flex: 1,
    marginBottom: 20,
  },
});
